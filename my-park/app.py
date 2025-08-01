from flask import Flask
from blueprints.home import home_bp

def create_app():
    app = Flask(__name__)
    
    # Register blueprints
    app.register_blueprint(home_bp)

    @app.after_request
    def no_cache(response):
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        return response

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=80, debug=True)