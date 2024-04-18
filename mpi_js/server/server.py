from websocket_server import WebsocketServer
import json

### Message Format is a dictionary with the following:
# {
# 	"node_receiver": "The node_id of the receiver",
# 	"message": "The message",
# 	"timestamp": "The timestamp",
# 	"message_type" : "routing" or "data"
#    ------------ the above are passed by the sender and are not read by the server, they are for node routing purposes later
# 	"sender": "The sender_id",
# 	"gr_receiver": "The receiver_id at the gr level"
#   "nodes_updated": List of nodes that gr has local access to has changed
# }

### Client data
# {
# 	"client_id": "The client_id",
# 	"nodes": "The nodes that the client has access to"
# }

routing_table = dict()
client_map = dict()
clients = 0

# Called for every client connecting (after handshake)
def new_client(client, server):
	clients += 1

	client_map[clients] = client

	routing_table[clients] = [int(id) for id in client['nodes']]
	print(routing_table)

	# send the client their assigned id
	server.send_message(client, json.dumps({"client_id": clients}))
	server.send_message_to_all(json.dumps({"routing_table": routing_table})) # let clients know about the route table being updated

# Called for every client disconnecting
def client_left(client, server):
	# Shit is most likely fucked
	print("Client(%d) disconnected" % client['id'])

	# delete associated data
	del client_map[int(client['id'])]
	del routing_table[int(client['id'])]

	server.send_message_to_all(json.dumps({"routing_table": routing_table})) # let clients know about the gr list being updated


# Called when a client sends a message
def message_received(client, server, message):
	message = json.loads(message)

	gr_recv = int(message["gr_receiver"])
	receiver = client_map[gr_recv]

	if bool(message["nodes_updated"]):
		routing_table[int(client['id'])] = [int(id) for id in client['nodes']]
	
	server.send_message(receiver, json.dumps(message)) # forward


PORT=9001
server = WebsocketServer(port = PORT)
server.set_fn_new_client(new_client)
server.set_fn_client_left(client_left)
server.set_fn_message_received(message_received)
server.run_forever()