from websocket_server import WebsocketServer
import json
import time

### Message Format is a dictionary with the following:
# {
# 	"gr_src": "The sender's gr_id",
# 	"gr_dest_arr": "The receivers' gr_id",
#   "data": Holds node related info including the message to be sent,
# }

class PerformanceMonitor:
    def __init__(self, description):
        self.start_time = 0
        self.count = 0
        self.total_count = 0
        self.description = description

    def update(self):
        self.count += 1
        self.total_count += 1
        time.time() - self.start_time > 5 and self.flush()

    def flush(self):
        print(
            f"{self.description}: {self.total_count} total, {(self.count / (time.time() - self.start_time)):.2f} per second"
        )
        self.start_time = time.time()
        self.count = 0


SETUP, RUNNING = 0, 1

client_id_map = {}
clients = dict()
num_procs = dict()
state = SETUP
program_path = ""
send_perf, recv_perf = None, None


def new_client(client, server):
    if state == RUNNING:
        return server.send_message(client, json.dumps({"error": "Cannot connect to server. MPI is running"}))
    else:
        client_id = len(clients)
        client_id_map[client["id"]] = client_id
        clients[client_id] = client
        print(f"New client [{client_id}] connected")
        server.send_message(client, json.dumps({"gr_id": client_id}))


def client_left(client, server):
    global state, clients, num_procs, client_id_map, program_path
    if state == RUNNING:
        print(f"Client disconnected. MPI Abort.")
        recv_perf.flush()
        send_perf.flush()
        state = SETUP
        clients = dict()
        num_procs = dict()
        client_id_map = dict()
        program_path = ""
        server.disconnect_clients_gracefully()
        server.allow_new_connections()
    else:
        if len(clients) == 0:
            return
        client_id = client_id_map[client["id"]]
        print(f"Client [{client_id}] disconnected.")
        for i in range(client_id, len(clients) - 1):
            clients[i] = clients[i + 1]
            client_id_map[clients[i]["id"]] = i
            server.send_message(clients[i], json.dumps({"gr_id": i}))
        clients.pop(len(clients) - 1)


def message_received(client, server, message_str):
    global state, num_procs, program_path
    message = json.loads(message_str)
    if state == RUNNING:
        gr_dest_arr = message["gr_dest_arr"]
        recv_perf.update()
        for gr_dest in gr_dest_arr:
            receiver = clients[gr_dest]
            server.send_message(receiver, message_str)
            send_perf.update()

    else:
        def start_when_ready():
            global state, recv_perf, send_perf
            print(f"clients: {len(clients)} num_procs: {len(num_procs.keys())}")
            if len(clients) == len(num_procs.keys()):
                print("All clients connected. Starting MPI.")
                send_perf, recv_perf = PerformanceMonitor("Send"), PerformanceMonitor("Receive")
                nr_to_gr = dict()
                for gr_src in range(len(clients)):
                    offset = len(nr_to_gr.keys())
                    for i in range(offset, offset + num_procs[gr_src]):
                        nr_to_gr[i] = gr_src
                state = RUNNING
                server.deny_new_connections()
                server.send_message_to_all(json.dumps({"routing_table": nr_to_gr, "program_path": program_path}))

        if "num_proc" in message:  # message is giving routing info update
            gr_src, num_proc = message["gr_src"], message["num_proc"]
            num_procs[gr_src] = num_proc
            if gr_src == 0:
                program_path = message["program_path"]
            print(f"Client [{gr_src}] registered {num_proc} processes.")
            start_when_ready()


def start_server(port):
    server = WebsocketServer(port=port)
    server.set_fn_new_client(new_client)
    server.set_fn_client_left(client_left)
    server.set_fn_message_received(message_received)
    server.run_forever()
