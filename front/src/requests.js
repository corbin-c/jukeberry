const rootUrl = "http://" + window.location.host + "/api";
//~ const rootUrl = "http://localhost:5000/api";

const requests = {
  /* requests handler */
  makeRequest: async (url, body) => {
    let response;
    if (body) {
      response = await fetch(rootUrl + url, {
        method: "POST",
        body: JSON.stringify(body),
      });
    } else {
      response = await fetch(rootUrl + url);
    }
    if (!response.ok) {
      const error = await response.text();
      console.warn("server error", error);
      return {
        error,
      };
    }
    try {
      response = await response.json();
    } catch {
      console.log("no json response from server");
    }
    return response;
  },
  fetchFileList: async (path) => {
    const list = await requests.makeRequest("/files/list", {
      path: "./" + (path || ""),
    });
    return list;
  },
  search: async (context, query) => {
    return await requests.makeRequest("/search/" + context, {
      query,
    });
  },
  getSoundOutput: async () => {
    return await requests.makeRequest("/media/output");
  },
  setSoundOutput: async (value) => {
    return await requests.makeRequest("/media/output", { output: value });
  },
  /* media */
  shuffleAll: () => {
    requests.makeRequest("/media/play/music", { path: false, random: true });
  },
  play: async (context, path, type, random = false) => {
    await requests.makeRequest("/media/play/" + context, {
      recursive: type == "directory",
      random,
      path,
      id: context === "playlist" ? path : undefined,
      from: context === "playlist" ? type : undefined,
    });
  },
  sendCommand: (command) => {
    requests.makeRequest("/media/command", {
      command,
    });
  },
  stop: () => {
    requests.makeRequest("/media/stop");
  },
  /* playlist management */
  allPlaylists: async () => {
    return await requests.makeRequest("/playlist/all");
  },
  getPlaylist: async (id) => {
    return await requests.makeRequest("/playlist/get", {
      id,
    });
  },
  createPlaylist: async (name, path) => {
    return await requests.makeRequest("/playlist/create", {
      name,
      song: path,
    });
  },
  addToPlaylist: async (id, path) => {
    return await requests.makeRequest("/playlist/add", {
      id,
      song: path,
    });
  },
  removePlaylist: async (id) => {
    return await requests.makeRequest("/playlist/delete", {
      id,
    });
  },
  removeTrack: async (id, path) => {
    return await requests.makeRequest("/playlist/remove", {
      id,
      song: path,
    });
  },
  organizePlaylist: async (id, path, index) => {
    return await requests.makeRequest("/playlist/organize", {
      id,
      song: path,
      position: index,
    });
  },
  /* radio */
  allRadios: async () => {
    return await requests.makeRequest("/radio/list");
  },
  addRadio: async (name, url) => {
    return await requests.makeRequest("/radio/create", { name, url });
  },
  playRadio: (url) => {
    requests.makeRequest("/radio/play", { url });
  },
  toggleFavoriteRadio: async (url) => {
    return await requests.makeRequest("/radio/toggle-favorite", { url });
  },
  removeRadio: async (url) => {
    return await requests.makeRequest("/radio/delete", { url });
  },
  /* podcasts */
  allPodcasts: async () => {
    return await requests.makeRequest("/podcast/list");
  },
  addPodcast: async (url) => {
    return await requests.makeRequest("/podcast/create", { url });
  },
  updatePodcast: async (url) => {
    return await requests.makeRequest("/podcast/update", { url });
  },
  viewPodcast: async (url) => {
    return await requests.makeRequest("/podcast/view", { url });
  },
  playPodcast: (feedUrl, url) => {
    requests.makeRequest("/podcast/play", { feedUrl, url });
  },
  removePodcast: async (url) => {
    return await requests.makeRequest("/podcast/delete", { url });
  },
  /* advanced */
  regenerate: () => {
    requests.makeRequest("/files/regenerate");
  },
  halt: () => {
    requests.makeRequest("/media/halt");
  },
  getMetadata: async () => {
    return await requests.makeRequest("/media/metadata");
  },
  fakeMetadata: async () => {
    return await requests.makeRequest("/media/metadata/fake");
  },
};
export default requests;
