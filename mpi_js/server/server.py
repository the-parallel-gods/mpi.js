from websocket_server import WebsocketServer
import json

### Message Format is a dictionary with the following:
# {
# 	"gr_sender": "The sender's id",
# 	"gr_receiver": "The receiver's id",
#   "data": Holds node related info including the message to be sent,
# }

client_map = dict()
clients = 0

# Called for every client connecting (after handshake)
def new_client(client, server):
	clients += 1

	client_map[clients] = client

	# send the client their assigned id
	server.send_message(client, json.dumps({"client_id": clients}))

# Called for every client disconnecting
def client_left(client, server):
	# Shit is most likely fucked
	print("Client(%d) disconnected" % client['id'])

	# delete associated data
	del client_map[int(client['id'])]

	server.send_message_to_all(json.dumps({"deleted_id": int(client['id'])})) # let clients know about the gr list being updated


# Called when a client sends a message
def message_received(client, server, message):
	message = json.loads(message)

	gr_recv = int(message["gr_receiver"])
	receiver = client_map[gr_recv]
	
	server.send_message(receiver, json.dumps(message)) # forward


PORT=9001
server = WebsocketServer(port = PORT)
server.set_fn_new_client(new_client)
server.set_fn_client_left(client_left)
server.set_fn_message_received(message_received)
server.run_forever()