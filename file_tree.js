// Copyright (c) 2013 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

FileTree = function(filer, spark) {
  this.filer = filer;
  this.spark = spark;
  this.parentElement = $('#filetree');
  this.entries = [];
};

FileTree.prototype.refresh = function(selectItemEnabled) {
  this.entries = [];
  var fileTree = this;
  var reader =
      this.spark.projects[this.spark.ActiveProjectName].createReader();
  var handleProjectLs = function(entries) {
    this.parentElement.empty();
    for (var i = 0; i < entries.length; ++i) {
      this.handleCreatedEntry(false, null, entries[i]);
    }
    
    var openedOne = false;
    var firstEntry = null;
    var selectedItemIndex = -1;
    var filteredEntries = new Array();

    // TODO(dvh): should open the last opened file on this project.
    // Try to open the manifest file.
    for (var i = 0; i < entries.length; ++i) {
      if (entries[i].name == 'prefs')
        continue;
      if (firstEntry == null)
        firstEntry = entries[i];
      if (entries[i].name == 'manifest.json') {
        openedOne = true;
        selectedItemIndex = i;
        firstEntry = entries[i];
      }
      filteredEntries.push(entries[i]);
    }

    // If manifest has not been found, open the first valid entry.
    if (!openedOne) {
      if (firstEntry != null) {
        selectedItemIndex = 0;
      }
    }
    
    this.spark.fileViewControllerTreeUpdated(filteredEntries);
    if (selectItemEnabled) {
      if (openedOne) {
        this.openFileEntry(firstEntry);
        this.spark.fileViewControllerSetSelection([entries[selectedItemIndex]]);
      }
    }
  };
  reader.readEntries(handleProjectLs.bind(this));
}

FileTree.prototype.handleProjectsLs = function(entries) {
  var fileTree = this;
  entries.forEach(function(entry, i) {
    fileTree.handleCreatedEntry(false, null, entry);
  });
};

FileTree.prototype.openFileEntry = function(fileEntry) {
  fileEntry.active = true;
  if (!fileEntry.buffer) {
    // This feels wrong.
    fileEntry.buffer = new Buffer(fileEntry);
  } else {
    fileEntry.buffer.switchTo();
  }
}

FileTree.prototype.closeOpendTabs = function() {
  for (var fname in this.entries) {
    if (fname == 'prefs')
      continue;
    var entry = this.entries[fname];
    if (entry.buffer != null) {
      entry.buffer.userRemoveTab();
    }
  }
};

FileTree.prototype.createNewFile = function(name, callback) {
  var entry = this.entries[name];
  if (entry) {
    console.log(name + ': file already exist.');
    if (!entry.buffer)
      entry.buffer = new Buffer(entry);
    entry.buffer.switchTo();
    $('#new-file-name').val('');
    return;
  }
  this.spark.projects[this.spark.ActiveProjectName].getFile(
      name, {create: true}, this.handleCreatedEntry.bind(this, true, callback), errorHandler);
}

FileTree.prototype.handleCreatedEntry = function(switchToBufferEnabled, callback, fileEntry) {
  var fileTree = this;
  fileEntry.active = false;
  this.entries[fileEntry.name] = fileEntry;
  
  if (switchToBufferEnabled) {
    fileEntry.buffer = new Buffer(fileEntry);
    fileEntry.buffer.switchTo();
    $('#new-file-name').val('');
  }
  
  if (callback != null) {
    callback();
  }
};
