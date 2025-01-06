function getSubfolders(folderPath, callback) {
    fs.readdir(folderPath, { withFileTypes: true }, (err, files) => {
        if (err) {
            return callback(err);
        }

        const subfolders = [];
        files.forEach(file => {
            if (file.isDirectory()) {
                subfolders.push(file.name);
            }
        });
        subfolders.sort(); // Sort the subfolders

        callback(null, subfolders);
    });
}

function createBar(content) {
    const bar = document.createElement('div');
    bar.className = 'bar';

    const h1 = document.createElement('h1');
    h1.textContent = content;
    bar.appendChild(h1);

    const button = document.createElement('button');
    button.textContent = 'x';
    bar.appendChild(button);

    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    bar.appendChild(editButton);

    const contentDiv = document.querySelector('.sidebar .content');
    if (contentDiv) {
        contentDiv.appendChild(bar);
    } else {
        console.error('Content element not found');
    }
}

function getTitleFromSubfolder(subfolderPath, callback) {
    const titleFilePath = path.join(subfolderPath, 'title.txt');
    fs.readFile(titleFilePath, 'utf8', (err, data) => {
        if (err) {
            return callback(err);
        }
        const firstLine = data.split('\n')[0];
        callback(null, firstLine);
    });
}

function getContentFromSubfolder(subfolderPath, callback) {
    const contentFilePath = path.join(subfolderPath, 'content.txt');
    fs.readFile(contentFilePath, 'utf8', (err, data) => {
        if (err) {
            return callback(err);
        }
        callback(null, data);
    });
}

const folderPath = 'notes/';
const titleToSubfolderMap = {};

getSubfolders(folderPath, (err, subfolders) => {
    if (err) {
        return console.error('Error reading subfolders:', err);
    }

    subfolders.forEach(subfolder => {
        const subfolderPath = path.join(folderPath, subfolder);
        getTitleFromSubfolder(subfolderPath, (err, title) => {
            if (err) {
                return console.error('Error reading title from subfolder:', err);
            }
            titleToSubfolderMap[title] = subfolderPath;
            createBar(title);
        });
    });
});

document.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON' && event.target.textContent === 'x') {
        const bar = event.target.parentElement;
        const title = bar.querySelector('h1').textContent;
        const subfolderPath = titleToSubfolderMap[title];

        if (subfolderPath) {
            fs.rmdir(subfolderPath, { recursive: true }, (err) => {
                if (err) {
                    return console.error('Error deleting subfolder:', err);
                }
                bar.remove();
                delete titleToSubfolderMap[title]; // Remove the title from the map
                const notesViewer = document.querySelector('.notes_viewer');
                if (notesViewer) {
                    const noteDiv = notesViewer.querySelector('.note');
                    if (noteDiv) {
                        noteDiv.remove();
                    }
                }
                console.log(`Subfolder ${subfolderPath} deleted`);
            });
        }
    } else if (event.target.tagName === 'BUTTON' && event.target.textContent === 'Edit') {
        const bar = event.target.parentElement;
        const title = bar.querySelector('h1').textContent;
        const subfolderPath = titleToSubfolderMap[title];

        if (subfolderPath) {
            getContentFromSubfolder(subfolderPath, (err, content) => {
                if (err) {
                    return console.error('Error reading content from subfolder:', err);
                }
                showNoteCreator(title, content);
            });
        }
    } else if (event.target.closest('.bar')) {
        const bar = event.target.closest('.bar');
        const title = bar.querySelector('h1').textContent;
        const subfolderPath = titleToSubfolderMap[title];

        if (subfolderPath) {
            getContentFromSubfolder(subfolderPath, (err, content) => {
                if (err) {
                    return console.error('Error reading content from subfolder:', err);
                }
                const notesViewer = document.querySelector('.notes_viewer');
                if (notesViewer) {
                    notesViewer.innerHTML = ''; // Clear existing content
                    const noteDiv = document.createElement('div');
                    noteDiv.className = 'note';
                    const ul = document.createElement('ul');
                    content.split('\n').forEach(line => {
                        const li = document.createElement('li');
                        li.textContent = line;
                        ul.appendChild(li);
                    });
                    noteDiv.appendChild(ul);
                    notesViewer.appendChild(noteDiv);
                } else {
                    console.error('Notes viewer element not found');
                }
            });
        }
    }
});

function showNoteCreator(title = '', content = '') {
    const notesViewer = document.querySelector('.notes_viewer');
    if (notesViewer) {
        notesViewer.innerHTML = ''; // Clear existing content

        const noteCreatorDiv = document.createElement('div');
        noteCreatorDiv.className = 'note_creator';

        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.placeholder = 'Enter title';
        titleInput.value = title;
        noteCreatorDiv.appendChild(titleInput);

        const contentTextarea = document.createElement('textarea');
        contentTextarea.rows = 20;
        contentTextarea.placeholder = 'Enter content';
        contentTextarea.value = content;
        noteCreatorDiv.appendChild(contentTextarea);

        notesViewer.appendChild(noteCreatorDiv);
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        noteCreatorDiv.appendChild(saveButton);
        saveButton.addEventListener('click', () => {
            const newTitle = titleInput.value;
            const newContent = contentTextarea.value;

            if (titleToSubfolderMap[newTitle] && newTitle !== title) {
                return alert('A note with this title already exists. Please choose a different title.');
            }
            location.reload(); // Reload the app

            const subfolderPath = path.join(folderPath, newTitle);

            // Delete the old subfolder if it exists
            if (title && title !== newTitle) {
                const oldSubfolderPath = titleToSubfolderMap[title];
                if (oldSubfolderPath) {
                    fs.rmdirSync(oldSubfolderPath, { recursive: true });
                }
            }

            fs.mkdir(subfolderPath, { recursive: true }, (err) => {
                if (err) {
                    return console.error('Error creating subfolder:', err);
                }
                const titleFilePath = path.join(subfolderPath, 'title.txt');
                fs.writeFile(titleFilePath, newTitle, 'utf8', (err) => {
                    if (err) {
                        return console.error('Error writing title:', err);
                    }
                    const contentFilePath = path.join(subfolderPath, 'content.txt');
                    fs.writeFile(contentFilePath, newContent, 'utf8', (err) => {
                        if (err) {
                            return console.error('Error writing content:', err);
                        }
                        createBar(newTitle);
                        noteCreatorDiv.remove();
                        location.reload(); // Reload the app
                    });
                });
            });
        });
    } else {
        console.error('Notes viewer element not found');
    }
}
