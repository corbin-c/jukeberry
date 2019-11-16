let Utils = {
  newMainList: () => {
    let main = document.querySelector("main");
    main.innerHTML = "";
    let ul = document.createElement("ul");
    main.append(ul);
    return ul;
  },
  setFileInput: () => {
    let files = document.createElement("input");
    files.setAttribute("type","file");
    files.setAttribute("multiple","true");
    files.setAttribute("style","display: none;")
    document.querySelector("body").append(files);
    return new Promise(function(resolve,reject){
      files.addEventListener("change",async (e) => {
        let f = [...e.target.files].filter(i => i.type.indexOf("audio") >= 0);
        resolve(f);
      });
      files.click();
      files.remove();
    });
  },
  cleanName: (name,type="file") => {
    name = name.split("/").pop();
    name = name.replace(/_/g," ");
    if (type == "file") {
      name = name.split(".");
      if (name.length > 1) {
        name.pop();
        name = name.join(" ");
      }
    }
    return name
  },
  scrollTo: async (element) => {
    await Utils.wait(500);
    scroll({
      top:element.offsetTop-window.innerHeight/2,
      left:0,
      behavior:"smooth"
    });
    await Utils.wait(300);
    element.setAttribute("class","target");
  },
  wait: (t) => {
    return new Promise((resolve,reject) => {
      setTimeout(() => { resolve(); },t)
    })
  },
  remove: (element) => {
    element.setAttribute("class","toremove");
    element.addEventListener("transitionend", (event) => {
      event.target.remove()
    });
  },
  makeFolderChoice: () => {
    let hider = document.createElement("div");
    let section = document.createElement("section");
    let h2 = document.createElement("h2");
    let ul = document.createElement("ul");
    let to_blur = ["main ul","footer","header"];
    to_blur.map(e => document.querySelector(e).setAttribute("class","blur"));
    hider.setAttribute("id","hider");
    section.removeAll = () => {
      Utils.remove(hider);
      Utils.remove(section);
      to_blur.map(e => document.querySelector(e).setAttribute("class",""));
    };
    hider.addEventListener("click",section.removeAll);
    h2.innerText = "Emplacement de destination";
    document.querySelector("main").append(section);
    document.querySelector("main").append(hider);
    section.append(h2);
    section.append(ul);
    return section;
  }
}
export { Utils };
