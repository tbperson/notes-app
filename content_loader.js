window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector);
      if (element) element.innerText = text;
    };
  
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency]);
    }
  });
  
  // Constants
  const { ipcRenderer } = require('electron');
  const fs = require('fs');
  const path = require('path');
  
  // Function to read file and return an array of lines
  const readFileLines = (filePath) => {
    return fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean);
  };
  
  // Function to write data to a file
  const writeFile = (filePath, data) => {
    fs.appendFileSync(filePath, data, 'utf-8');
  };
  
  // Function to delete a file
  const deleteFile = (filePath) => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      console.error(`File not found: ${filePath}`);
    }
  };
  
  const emptyFile = (filePath) => {
    fs.writeFileSync(filePath, '', 'utf-8');
  };
  
  // Expose functions to the renderer process
  window.electronAPI = {
    readFileLines: (filePath) => readFileLines(filePath),
    writeFile: (filePath, data) => writeFile(filePath, data),
    deleteFile: (filePath) => deleteFile(filePath),
    emptyFile: (filePath) => emptyFile(filePath),
    send: (channel, data) => {
      // whitelist channels for the text files
      let validChannels = ["toMain"];
      if (validChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      }
    },
    receive: (channel, func) => {
      let validChannels = ["fromMain"];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    }
  };