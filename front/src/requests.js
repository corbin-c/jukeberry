const rootUrl = "http://localhost:5000/api";

const requests = {
  makeRequest: async (url,body) => { //handle when server throws an error
    let response;
    if (body) {
      response = await fetch(rootUrl+url, {
        method: "POST",
        body: JSON.stringify(body)
      });
    } else {
      response = await fetch(rootUrl+url);
    }
    if (!response.ok) {
      return {
        error: await response.text()
      }
    }
    try {
      response = await response.json();
    } catch {
      console.log("empty response from server");
    }
    return response;
  },
  fetchFileList: async (path) => {
    const list = await requests.makeRequest(
      "/files/list",
      {path: "./"+(path || "")}
    );
    return list;
  },
  search: async (context, query) => {
    return await requests.makeRequest(
      "/search/"+context,
      {
        query
      }
    );
  },
  play: async (context,path,type,random=false) => {
    await requests.makeRequest(
      "/media/play/"+context,
      {
        recursive: (type == "directory"),
        random,
        path
      }
    );
  },
  sendCommand: (command) => {
    requests.makeRequest("/media/command", {
      command
    });
  },
  stop: () => {
    requests.makeRequest("/media/stop");
  },
  allPlaylists: async () => {
    return await requests.makeRequest(
      "/playlist/all");
  },
  getPlaylist: async (id) => {
    return await requests.makeRequest(
      "/playlist/get",
      {
        id
      }
    );
  },
  createPlaylist: async (name, path) => {
    return await requests.makeRequest(
      "/playlist/create",
      {
        name,
        song: path
      }
    );
  },
  addToPlaylist: async (id, path) => {
    return await requests.makeRequest(
      "/playlist/add",
      {
        id,
        song: path
      }
    );
  },
  removePlaylist: async (id) => {
    return await requests.makeRequest(
      "/playlist/delete",
      {
        id,
      }
    );
  },
  removeTrack: async (id,path) => {
    return await requests.makeRequest(
      "/playlist/remove",
      {
        id,
        song: path
      }
    );
  }
};
export default requests;
