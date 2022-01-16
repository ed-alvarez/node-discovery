# node-discovery

This is a small PoC which main purpose is to discover OpenVPN services inside a network on all
available interfaces and IP ranges without specifying IPs or any kind of information about the network it's running on.

The idea behind this proof-of-concept is to be able to configure an OpenVPN client automatically regardless of the network it's running on without using tools that can be stopped by firewalls or network configurations.

The way this PoC works is by scanning a given port throughout all possible hosts from the current network gathered (e.g 192.168.0.0/24) by the device automatically.

# 1) Required services

This repository includes the services required by our client device. We're going to use Docker to simulate those services. You can skip these steps if you already have a device or environment with OpenVPN and Mosquitto already.

**Required tools to run these services:**

- Docker v20.10.8
- docker-compose v1.29.2

1. Create a volume for our OpenVPN service:

```
$ sudo docker volume create --name openvpn-data
```

2. Generate configuration files and certificates. The container will prompt for a passphrase to protect the private key used by the newly generated certificate authority.

```
$ sudo docker run -v openvpn-data:/etc/openvpn --rm kylemanna/openvpn ovpn_genconfig -u tcp://YOUR_HOST_IP
$ sudo docker run -v openvpn-data:/etc/openvpn --rm -it kylemanna/openvpn ovpn_initpki
```

3. Generate a client certificate without a passphrase:

```
$ sudo docker run -v openvpn-data:/etc/openvpn --rm -it kylemanna/openvpn easyrsa build-client-full CLIENTNAME nopass
```

4. Retrieve the client configuration with embedded certificates:

```
$ sudo docker run -v openvpn-data:/etc/openvpn --rm kylemanna/openvpn ovpn_getclient CLIENTNAME > CLIENTNAME.ovpn
```

This last command will create the client `.ovpn` file required.

**Keep track of the CLIENTNAME.ovpn file you have created.** We'll need it to run our client service after the steps below.

5. Start all required services using `docker-compose` in your host machine. Simply run:

```
$ sudo docker-compose up
```

# 2) Running node-discovery

In order to run this script accordingly you need the following configuration and software:

- NodeJS v14.17.6 or later
- OpenVPN
- Build Essential

1. Install OpenVPN in the device or machine you want this script to run passively. For this guide we're going to use Debian 10. Assuming you already have Debian 10, run the following commands:

```
$ sudo apt-get install -y nodejs openvpn build-essential
```

2. After OpenVPN is installed, we need to configure its client service to autostart whenever we reboot. Run:

```
$ sudo sed -i 's/#AUTOSTART="all"/AUTOSTART="all"/g' /etc/default/openvpn
```

3. Now we need a default OpenVPN client file. Since we are using Docker to simulate the required services for our second device, we are going to use the same tools to generate this `.ovpn` file. Upload the `CLIENTNAME.ovpn` file you generated in the previous steps to your client device or machine.

**If you already have an OpenVPN server you can upload your own `.ovpn` file as stated at the beginning of this document. We only need to authenticate the user against the server node-discovery finds.**

Assuming you have `scp` in your current environment you can run:

```
$ scp ./CLIENTNAME.ovpn username@client.machine:/home/username/
```

Otherwise, you can use any transfer client.

4. Rename CLIENTNAME.ovpn and move it to /etc/openvpn/

```
$ sudo mv ./CLIENTNAME.ovpn /etc/openvpn/client.conf
```

5. Enable `openvpn@client` systemd unit and start the client.

```
$ sudo systemctl enable openvpn@client
$ sudo systemctl start openvpn@client
```

6. Clone this repository on your client machine. After it's cloned, cd into it, and install `node-discovery`:

```
$ cd node-discovery
$ sudo make install
```

7. Enable `node-discovery` to start after reboots and start the service:

```
$ sudo systemctl enable node-discovery
$ sudo systemctl start node-discovery
```

# 3) Configuring node-discovery (optional)

If you wish you configure node-discovery with a specific port or Mosquitto host, you can do so by editing the configuration file located in `/usr/share/node-discovery/.env`. This dotenv file holds all the configuration needed.

By default we use the configuration required by the services included in the mentioned `docker-compose.yml` file.
