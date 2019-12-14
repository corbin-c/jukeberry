# jukeberry

## Installation

* git clone
* cd jukeberry
* npm install
* npm install -g ytdl
* echo "My Youtube API key" > youtube-api-key
* echo /path/to/music/dir/ > config

## Use

Run `node server.js`. Browse to `localhost:3000` (or
to whatever your IP is). You might want to redirect incoming connections on port
80 to port 3000 with `iptables`.
