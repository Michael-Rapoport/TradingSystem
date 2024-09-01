from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from logger import app_logger, trade_logger

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://username:password@localhost/dbname'
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this!
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
db = SQLAlchemy(app)
socketio = SocketIO(app)
jwt = JWTManager(app)
limiter = Limiter(app, key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Trade(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    asset = db.Column(db.String(10), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    price = db.Column(db.Float, nullable=False)
    type = db.Column(db.String(20), nullable=False)  # 'market', 'limit', 'stop', 'trailing_stop', 'oco'
    status = db.Column(db.String(10), nullable=False, default='pending')  # 'pending', 'executed', 'cancelled'
    target_price = db.Column(db.Float)  # For limit, stop, and trailing stop orders
    trail_percent = db.Column(db.Float)  # For trailing stop orders
    oco_link = db.Column(db.Integer, db.ForeignKey('trade.id'))  # For OCO orders
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    oco_pair = db.relationship('Trade', remote_side=[id], backref='oco_order')

@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username already exists"}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already exists"}), 400
    
    new_user = User(username=data['username'], email=data['email'])
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": "User created successfully"}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()
    if user and user.check_password(data['password']):
        access_token = create_access_token(identity=user.id)
        return jsonify(access_token=access_token), 200
    return jsonify({"error": "Invalid username or password"}), 401

@app.route('/api/order', methods=['POST'])
@jwt_required()
@limiter.limit("5 per minute")
def create_order():
    try:
        current_user_id = get_jwt_identity()
        data = request.json

        if data['type'] not in ['market', 'limit', 'stop', 'trailing_stop', 'oco']:
            raise APIError("Invalid order type", status_code=400)

        if data['type'] == 'trailing_stop' and 'trail_percent' not in data:
            raise APIError("Trail percent is required for trailing stop orders", status_code=400)

        if data['type'] == 'oco':
            if 'oco_order' not in data or len(data['oco_order']) != 2:
                raise APIError("OCO order must contain exactly two orders", status_code=400)

            # Create the first OCO order
            order1 = Trade(
                user_id=current_user_id,
                asset=data['asset'],
                amount=data['amount'],
                price=data['oco_order'][0]['price'],
                type=data['oco_order'][0]['type'],
                target_price=data['oco_order'][0].get('target_price')
            )
            db.session.add(order1)
            db.session.flush()  # This assigns an ID to order1

            # Create the second OCO order and link it to the first
            order2 = Trade(
                user_id=current_user_id,
                asset=data['asset'],
                amount=data['amount'],
                price=data['oco_order'][1]['price'],
                type=data['oco_order'][1]['type'],
                target_price=data['oco_order'][1].get('target_price'),
                oco_link=order1.id
            )
            db.session.add(order2)

            # Link the first order to the second
            order1.oco_link = order2.id

            db.session.commit()
            
            trade_logger.info(f"New OCO order created: {order1.id} and {order2.id} by user {current_user_id}")
            
            return jsonify({"message": "OCO Order placed successfully", "order_ids": [order1.id, order2.id]}), 201

        else:
            new_order = Trade(
                user_id=current_user_id,
                asset=data['asset'],
                amount=data['amount'],
                price=data['price'],
                type=data['type'],
                target_price=data.get('target_price'),
                trail_percent=data.get('trail_percent')
            )
            db.session.add(new_order)
            db.session.commit()
        
            trade_logger.info(f"New order created: {new_order.id} by user {current_user_id}")
        
            return jsonify({"message": "Order placed successfully", "order_id": new_order.id}), 201

    except KeyError as e:
        app_logger.error(f"Missing key in order data: {str(e)}")
        raise APIError(f"Missing required field: {str(e)}", status_code=400)
    except Exception as e:
        app_logger.error(f"Error creating order: {str(e)}")
        raise APIError("An unexpected error occurred", status_code=500)

@app.route('/api/portfolio')
@jwt_required()
def get_portfolio():
    current_user_id = get_jwt_identity()
    trades = Trade.query.filter_by(user_id=current_user_id).all()
    portfolio = {}
    for trade in trades:
        if trade.asset not in portfolio:
            portfolio[trade.asset] = 0
        if trade.type == 'buy':
            portfolio[trade.asset] += trade.amount
        else:
            portfolio[trade.asset] -= trade.amount
    return jsonify(portfolio)

if __name__ == '__main__':
    db.create_all()
    socketio.run(app, debug=True, ssl_context='adhoc')