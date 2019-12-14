# jukeberry

Jukeberry is a node-js app offering a web interface to remotely control media 
playback. It is intended to be used on a Raspberry Pi.

**Supported features :**
* browse, search & listen audio files
* random
* remotely adding files
* search and playback from Youtube
    (requires `ytdl` dependency and a youtube api key)
* listening to web radios

## Installation

* `git clone https://github.com/corbin-c/jukeberry.git`
* `cd jukeberry`
* `npm install`
* `npm install -g ytdl`
* `echo "My Youtube API key" > youtube-api-key`
* `echo /path/to/music/dir/ > config`

Mplayer is also required for media playback. Be sure to have rights on the
directory where the music is.

## Use

Run (or append to `~/.profile` for launch on login): `node server.js`.
Browse to `localhost:3000` (or to whatever your IP is).
You might want to redirect incoming connections on port 80 to port 3000 with
`iptables`.
