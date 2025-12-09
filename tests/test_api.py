import pytest
import sys
import os

# Add the project root to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_health_check(client):
    """Test the health check endpoint returns 200"""
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json['status'] == 'ok'
