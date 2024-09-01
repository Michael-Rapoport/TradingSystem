from celery import Celery
from app import app, db, Trade
from sqlalchemy import and_

celery = Celery(app.name, broker='redis://localhost:6379/0')
celery.conf.update(app.config)

@celery.task
def process_orders():
    with app.app_context():
        # Process trailing stop orders
        trailing_stops = Trade.query.filter_by(type='trailing_stop', status='pending').all()
        for order in trailing_stops:
            current_price = get_current_price(order.asset)  # You need to implement this function
            if current_price >= order.price:
                # Update the stop price
                new_stop_price = current_price * (1 - order.trail_percent / 100)
                if new_stop_price > order.price:
                    order.price = new_stop_price
            elif current_price <= order.price:
                # Execute the order
                execute_order(order)

        # Process stop and limit orders
        stop_and_limit = Trade.query.filter(
            and_(
                Trade.type.in_(['stop', 'limit']),
                Trade.status == 'pending'
            )
        ).all()
        for order in stop_and_limit:
            current_price = get_current_price(order.asset)
            if (order.type == 'stop' and current_price <= order.target_price) or \
               (order.type == 'limit' and current_price >= order.target_price):
                execute_order(order)

        # Process OCO orders
        oco_orders = Trade.query.filter_by(type='oco', status='pending').all()
        for order in oco_orders:
            if order.oco_pair and order.oco_pair.status == 'executed':
                # Cancel this order as its pair has been executed
                order.status = 'cancelled'
            else:
                current_price = get_current_price(order.asset)
                if (order.type == 'stop' and current_price <= order.target_price) or \
                   (order.type == 'limit' and current_price >= order.target_price):
                    execute_order(order)
                    if order.oco_pair:
                        order.oco_pair.status = 'cancelled'

        db.session.commit()

def execute_order(order):
    # In a real system, you would interact with the exchange API here
    order.status = 'executed'
    # Log the execution
    app.logger.info(f"Order executed: {order.id}")

# Schedule this task to run periodically
@celery.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    sender.add_periodic_task(10.0, process_orders.s(), name='process orders every 10 seconds')

def get_current_price(asset):
    # This function should be implemented to fetch the current price of the asset
    # For example, you might use a third-party API or your own price feed
    # For simplicity, we'll return a dummy value here
    return 50000  # Dummy value for demonstration