from flask import Flask
from flask_cors import CORS
from database import init_db
from routes.optimize import optimize_bp
from routes.taxis import taxis_bp
from routes.trips import trips_bp
from routes.dashboard import dashboard_bp

def create_app():
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173",
                        "http://localhost:3000", "http://127.0.0.1:3000"])

    # Initialize database
    with app.app_context():
        init_db()

    # Register blueprints
    app.register_blueprint(optimize_bp, url_prefix='/api/optimize')
    app.register_blueprint(taxis_bp, url_prefix='/api/taxis')
    app.register_blueprint(trips_bp, url_prefix='/api/trips')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')

    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'message': 'Smart Taxi Route Optimizer API is running'}

    @app.errorhandler(404)
    def not_found(e):
        return {'error': 'Endpoint not found'}, 404

    @app.errorhandler(500)
    def server_error(e):
        return {'error': 'Internal server error', 'detail': str(e)}, 500

    return app


if __name__ == '__main__':
    app = create_app()
    print("🚕 Smart Taxi Route Optimizer Backend starting...")
    print("📡 API running at http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
