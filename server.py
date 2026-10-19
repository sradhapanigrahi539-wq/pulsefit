"""
PulseFit Local Server & Auto-Launcher
Runs a local HTTP server and automatically opens the browser.
"""
import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def main():
    os.chdir(DIRECTORY)
    url = f"http://localhost:{PORT}/index.html"
    print(f"==================================================")
    print(f"⚡ PulseFit Pro Server Running at: {url}")
    print(f"Press Ctrl+C to stop the server.")
    print(f"==================================================")
    
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Could not open browser automatically: {e}")

    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down PulseFit server.")
            httpd.server_close()

if __name__ == "__main__":
    main()
