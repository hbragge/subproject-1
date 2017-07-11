(function() {

  'use strict';

  var ENTER_KEY = 13;
  var newTodoDom = document.getElementById('new-todo');
  var syncDom = document.getElementById('sync-wrapper');

  // EDITING STARTS HERE (you dont need to edit anything above this line)

  var db = new PouchDB('todos');
  var remoteDb = new PouchDB('http://admin:admin@192.168.33.10:5984/todos', {skip_setup: true});

  function signup() {
    remoteDb.signup('batman', 'brucewayne', function (err, response) {
      if (err) {
        if (err.name === 'conflict') {
          console.log('"batman" already exists, choose another username');
        } else if (err.name === 'forbidden') {
          console.log('invalid username');
        } else {
          console.log('signup failed');
        }
      }
    });
  }

  function loginUser() {
    remoteDb.login('batman', 'brucewayne', function (err, response) {
      if (err) {
        if (err.name === 'unauthorized') {
          console.log('name or password incorrect');
        } else {
          console.log('login failed');
        }
      }
      showLogin();
    });
  }

  function logoutUser() {
    remoteDb.logout(function (err, response) {
      if (err) {
        console.log('logout error');
      }
      console.log(response);
      showLogin();
    });
  }

  function showLogin() {
    remoteDb.getSession(function (err, response) {
      if (err) {
        console.log('getSession network error');
      } else if (!response.userCtx.name) {
        console.log('nobody logged in');
        var statusLine = document.getElementById('status-line');
        statusLine.innerHTML = 'Nobody logged in';
      } else {
        console.log(response.userCtx.name);
        var statusLine = document.getElementById('status-line');
        statusLine.innerHTML = 'Welcome, '+response.userCtx.name;
      }
    });
  }

  function setupHeadline() {
    var headLine = document.getElementById('head-line');

    var loginLink = document.createElement('button');
    //loginLink.className = '';
    loginLink.type = "button";
    loginLink.appendChild( document.createTextNode('Login'));
    loginLink.addEventListener('click', loginUser);

    var logoutLink = document.createElement('button');
    //logoutLink.className = '';
    logoutLink.type = "button";
    logoutLink.appendChild( document.createTextNode('Logout'));
    logoutLink.addEventListener('click', logoutUser);

    headLine.appendChild(loginLink);
    headLine.appendChild(logoutLink);
  }

  db.changes({
    since: 'now',
    live: true
  }).on('change', showTodos);

  // We have to create a new todo document and enter it in the database
  function addTodo(text) {
    var todo = {
      _id: new Date().toISOString(),
      title: text,
      completed: false
    };
    db.put(todo, function callback(err, result) {
      if (!err) {
        console.log('Successfully posted a todo!');
      }
    });
  }

  // Show the current list of todos by reading them from the database
  function showTodos() {
    db.allDocs({include_docs: true, descending: true}, function(err, doc) {
      redrawTodosUI(doc.rows);
    });
  }

  function checkboxChanged(todo, event) {
    todo.completed = event.target.checked;
    db.put(todo);
  }

  // User pressed the delete button for a todo, delete it
  function deleteButtonPressed(todo) {
    db.remove(todo);
  }

  // The input box when editing a todo has blurred, we should save
  // the new title or delete the todo if the title is empty
  function todoBlurred(todo, event) {
    var trimmedText = event.target.value.trim();
    if (!trimmedText) {
      db.remove(todo);
    } else {
      todo.title = trimmedText;
      db.put(todo);
    }
  }

  // Initialise a sync with the remote server
  function sync() {
    syncDom.setAttribute('data-sync-state', 'syncing');
    var opts = {live: true};
    db.replicate.to(remoteDb, opts, syncError);
    db.replicate.from(remoteDb, opts, syncError);
  }

  // EDITING STARTS HERE (you dont need to edit anything below this line)

  // There was some form or error syncing
  function syncError() {
    syncDom.setAttribute('data-sync-state', 'error');
  }

  // User has double clicked a todo, display an input so they can edit the title
  function todoDblClicked(todo) {
    var div = document.getElementById('li_' + todo._id);
    var inputEditTodo = document.getElementById('input_' + todo._id);
    div.className = 'editing';
    inputEditTodo.focus();
  }

  // If they press enter while editing an entry, blur it to trigger save
  // (or delete)
  function todoKeyPressed(todo, event) {
    if (event.keyCode === ENTER_KEY) {
      var inputEditTodo = document.getElementById('input_' + todo._id);
      inputEditTodo.blur();
    }
  }

  // Given an object representing a todo, this will create a list item
  // to display it.
  function createTodoListItem(todo) {
    var checkbox = document.createElement('input');
    checkbox.className = 'toggle';
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', checkboxChanged.bind(this, todo));

    var label = document.createElement('label');
    label.appendChild( document.createTextNode(todo.title));
    label.addEventListener('dblclick', todoDblClicked.bind(this, todo));

    var deleteLink = document.createElement('button');
    deleteLink.className = 'destroy';
    deleteLink.addEventListener( 'click', deleteButtonPressed.bind(this, todo));

    var divDisplay = document.createElement('div');
    divDisplay.className = 'view';
    divDisplay.appendChild(checkbox);
    divDisplay.appendChild(label);
    divDisplay.appendChild(deleteLink);

    var inputEditTodo = document.createElement('input');
    inputEditTodo.id = 'input_' + todo._id;
    inputEditTodo.className = 'edit';
    inputEditTodo.value = todo.title;
    inputEditTodo.addEventListener('keypress', todoKeyPressed.bind(this, todo));
    inputEditTodo.addEventListener('blur', todoBlurred.bind(this, todo));

    var li = document.createElement('li');
    li.id = 'li_' + todo._id;
    li.appendChild(divDisplay);
    li.appendChild(inputEditTodo);

    if (todo.completed) {
      li.className += 'complete';
      checkbox.checked = true;
    }

    return li;
  }

  function redrawTodosUI(todos) {
    var ul = document.getElementById('todo-list');
    ul.innerHTML = '';
    todos.forEach(function(todo) {
      ul.appendChild(createTodoListItem(todo.doc));
    });
  }

  function newTodoKeyPressHandler( event ) {
    if (event.keyCode === ENTER_KEY) {
      addTodo(newTodoDom.value);
      newTodoDom.value = '';
    }
  }

  function addEventListeners() {
    newTodoDom.addEventListener('keypress', newTodoKeyPressHandler, false);
  }

  addEventListeners();
  setupHeadline();
  showTodos();
  showLogin();

  if (remoteDb) {
    sync();
  }

})();
