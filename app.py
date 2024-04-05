import argparse
from mpi_js import server

parser = argparse.ArgumentParser(description="Launch MPI.js")
parser.add_argument("-n", "--no_browser", action="store_true", help="Don't open browser by default.")
args = parser.parse_args()
server.startServer(not args.no_browser, 8000)
# ws_server.startServer(8001)
