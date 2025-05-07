from flask import Flask, send_from_directory
import os

app = Flask(__name__)

@app.route('/')
def index():
    """Serve the main index.html file"""
    return send_from_directory('file_flip_web', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files from the file_flip_web directory"""
    return send_from_directory('file_flip_web', path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)