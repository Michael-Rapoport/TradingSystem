

import pytest
from app import app, db, User, Trade
import json

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    client = app.test_client()

    with app.app_context():
        db.create_all()

    yield client

    with app.app_context():
        db.drop_all()

def test_register(client):
    response = client.post('/api/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpassword'
    })
    assert response.status_code == 201
    assert b"User created successfully" in response.data

def test_login(client):
    # First register a user
    client.post('/api/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpassword'
    })

    # Then try to log in
    response = client.post('/api/login', json={
        'username': 'testuser',
        'password': 'testpassword'
    })
    assert response.status_code == 200
    assert 'access_token' in json.loads(response.data)

def test_create_order(client):
    # Register and login
    client.post('/api/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': 'testpassword'
    })
    login_response = client.post('/api/login', json={
        'username': 'testuser',
        'password': 'testpassword'
    })
    access_token = json.loads(login_response.data)['access_token']

    # Create an order
    response = client.post('/api/order', 
        headers={'Authorization': f'Bearer {access_token}'},
        json={
            'asset': 'BTC',
            'amount': 1.0,
            'price': 50000,
            'type': 'limit'
        }
    )
    assert response.status_code == 201
    assert b"Order placed successfully" in response.data

# Add more tests as needed

.gitignore
__pycache__/
*.py[cod]
*.so

# Virtual environment
venv/
env/

# Node
node_modules/
npm-debug.log
yarn-error.log

# Next.js
.next/
out/

# IDEs
.vscode/
.idea/

# OS generated files
.DS_Store
Thumbs.db

# Environment variables
.env
.env.local

# Logs
*.log

# Database
*.sqlite

# Docker
docker-compose.override.yml

# Temporary files
*.swp
*.swo
*~