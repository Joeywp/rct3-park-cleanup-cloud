var R3D = null;
var v_GUIEnabled = true;
var progMax = -1;
var currentDATFile = null;
const mapscalefactor = 4;

var newFile;
var originalFile;

//Canvas
function setPixel(imageData, x, y, r, g, b, a) {
    index = (x + y * imageData.width) * 4;
    imageData.data[index + 0] = r;
    imageData.data[index + 1] = g;
    imageData.data[index + 2] = b;
    imageData.data[index + 3] += a;
}


// Simulated multithreading, as sending the buffer to a webworker turned out not to be working that great unfortunately
function SaveFilePart(type, currentIterator) {
    var startTime = Date.now();
    if (type == 0) {
        if (currentIterator == 0)
            newFile.writeUint32(R3D.clasdefinitions.length, true);

        for (var i = currentIterator; i < R3D.clasdefinitions.length; i++) {
            var start = R3D.clasdefinitions[i].start;
            var end = R3D.clasdefinitions[i].end;
            var len = end - start;

            originalFile.seek(start);
            for (var j = 0; j < len; j++) {
                newFile.writeUint8(originalFile.getUint8(start + j));
            }

            if (i % 75 == 0)
                SetProgress(newFile.tell());

            if (Date.now() > (startTime + 20))
                return setTimeout(function () {
                    SaveFilePart(0, i + 1)
                }, 1);
        }
        return setTimeout(function () {
            SaveFilePart(1, 0)
        }, 1);
    }

    if (type == 1) {

        if (currentIterator == 0)
            newFile.writeUint32(GetBlockCount());

        for (var i = currentIterator; i < R3D.blocks.length; i++) {
            if (!$('#checkbox_item' + i).attr('checked')) {
                var start = R3D.blocks[i].start;
                var end = R3D.blocks[i].end;
                var len = end - start;

                originalFile.seek(start);
                for (var j = 0; j < len; j++) {
                    newFile.writeUint8(originalFile.getUint8(start + j));
                }
            }

            if (i % 75 == 0)
                SetProgress(newFile.tell());

            if (Date.now() > (startTime + 20))
                return setTimeout(function () {
                    SaveFilePart(1, i + 1)
                }, 1);
        }
    }

    var blob = new Blob([new Uint8Array(newFile.buffer)], {type: "application/octet-stream"});


    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "cleaned_file.dat";
    a.click();

    ShowStatus(false);
    GUIEnabled(true);
}

function SaveParkFile() {
    if (R3D == null) {
        alert('You have to load a file first!');
        return;
    }

    GUIEnabled(false);

    var buf = new ArrayBuffer(GetNewFilesize());

    progMax = GetNewFilesize();

    $('#status').html('Current status: Preparing savefile');
    SetProgress(0);
    ShowStatus(true);

    /*var worker = new Worker("threads/save.js");	
     worker.onmessage = function (e) {
     var params = JSON.parse(e.data);
     if(params.type == 'Finished')
     {
     //finishcallback(params.IDList);
     ShowStatus(false);
     GUIEnabled(true);
     } else if(params.type == 'Error')
     {
     alert('Error: ' + params.msg);
     return;
     } else if(params.type == 'Progress')
     {	
     SetProgress(params.value);
     //$('#procesprogress').val(params.value);
     }
     }
     worker.postMessage(JSON.stringify({
     currentDATFile: Array.apply(null, new Uint8Array(currentDATFile)),
     buf : Array.apply(null, new Uint8Array(buf)),
     blockList : GetBlockList(),
     R3D : R3D
     }));*/

    originalFile = new jDataView(currentDATFile);
    originalFile._littleEndian = true;

    newFile = new jDataView(buf);
    newFile._littleEndian = true;

    SaveFilePart(0, 0);
}

function SetRelPixel(imageData, x, y, r, g, b, a) {
    for (var i = 0; i < mapscalefactor; i++)
        for (var j = 0; j < mapscalefactor; j++)
            setPixel(imageData, x + i, y + j, r, g, b, a);
}

function HasDragAndDrop() {
    if (typeof window.FileReader === 'undefined')
        return false;
    return true;
}

function RoundDec(num, dec) {
    return Math.round(num * Math.pow(10, dec)) / Math.pow(10, dec);
}

function BytesStringmaker(bytesize) {
    var type = 'b';
    if (bytesize > 1024) {
        type = 'kb';
        bytesize /= 1024;
    }
    if (bytesize > 1024) {
        type = 'mb';
        bytesize /= 1024;
    }
    return RoundDec(bytesize, 2) + ' ' + type;
}

function HandleDrop(evt) {
    var files;
    if (typeof evt.dataTransfer == 'undefined') {
        //Sender = manual
        files = evt;
    } else {
        //Sender = drag and drop
        files = evt.dataTransfer.files;
        evt.stopPropagation();
        evt.preventDefault();
    }
    if (!v_GUIEnabled)
        return;

    if (!files.length) {
        alert("You must select a file first!");
        return;
    }
    $(this).css('background-color', 'white');
    $('#droptext').html(files[0].name);

    UpdateProgress(null);
    ShowStatus(true);
    $('#itemlist').html('');
    //StartParsingArchive(files[0], ParsingFinished, UpdateProgress, ParsingError, PRE_ITEMLIST);

    var reader = new FileReader();
    reader.onloadend = function (evt) {
        currentDATFile = evt.target.result;
        StartParsingArchive(files[0], ParsingFinished, UpdateProgress, ParsingError, PRE_ITEMLIST);
    };

    var file = files[0];
    if (file.slice) {
        var blob = file.slice(0, file.size);
    } else if (file.mozSlice) {
        var blob = file.mozSlice(0, file.size);
    }
    reader.readAsBinaryString(blob);
}

function ParsingError(e) {
    console.log(e);
    alert('Error: ' + e.msg);
    ShowStatus(false);
}

function ParsingFinished(e, params, flags) {
    R3D = e;
    var x, y;
    //console.log(R3D.file);
    if (flags & PRE_ITEMLIST) {
        $('#itemlist').html(params);
    }
    ShowStatus(false);
    CalculateNewFileSize(null);

    $('#itemlist').on('click', 'input', function (e) {
        CalculateNewFileSize(e);
    });
    $('#devlist').html('');


    $("#parkmap").remove();
    $("#parkmap_holder").append("<canvas id='parkmap'></canvas>");

    var canvas = document.getElementById("parkmap");
    var context = canvas.getContext("2d");
    // return;//Rendering the map uses too many resources, temporary removed
    for (var i = 0; i < R3D.blocks.length; i++)
        if (R3D.clasdefinitions[R3D.blocks[i].classprototype].name == 'RCT3Terrain')
            for (var j = 0; j < R3D.blocks[i].vars.length; j++)
                if (R3D.blocks[i].vars[j].name == "EngineTerrain") {
                    x = R3D.blocks[i].vars[j].data.sizex;
                    y = R3D.blocks[i].vars[j].data.sizey;
                    canvas.width = R3D.blocks[i].vars[j].data.sizex * mapscalefactor;
                    canvas.height = R3D.blocks[i].vars[j].data.sizey * mapscalefactor;
                }
    context.clearRect(0, 0, 256 * mapscalefactor, 256 * mapscalefactor);
    var mapdata = context.createImageData(x * mapscalefactor, y * mapscalefactor);
    for (var i = 0; i < x; i++)
        for (var j = 0; j < y; j++)
            SetRelPixel(mapdata, i * (mapscalefactor), j * (mapscalefactor), 137, 241, 147, 128);

    for (var i = 0; i < R3D.blocks.length; i++) {
        if (R3D.clasdefinitions[R3D.blocks[i].classprototype].name == 'SceneryItem') {
            var posx = -1, posy = -1;
            //$('#devlist').append('Item ' + (i+1) + ' is an instance of ' + R3D.clasdefinitions[R3D.blocks[i].classprototype].name + '<br/>');
            for (var j = 0; j < R3D.blocks[i].vars.length; j++) {
                //$('#devlist').append(R3D.blocks[i].vars[j].name + ' | ' + R3D.blocks[i].vars[j].data + '<br/>');
                if (R3D.blocks[i].vars[j].name == "POSX") {
                    posx = R3D.blocks[i].vars[j].data;
                } else if (R3D.blocks[i].vars[j].name == "POSZ") {
                    posy = R3D.blocks[i].vars[j].data;
                }
            }
            //$('#devlist').append('<hr/><br/>');
            SetRelPixel(mapdata, posx * (mapscalefactor), posy * (mapscalefactor), 244, 68, 72, 0x04);
        }
        /* else if(R3D.clasdefinitions[R3D.blocks[i].classprototype].name == 'RCT3Terrain')
         {
         $('#devlist').append('Item ' + (i+1) + ' is an instance of ' + R3D.clasdefinitions[R3D.blocks[i].classprototype].name + '<br/>');

         for(var j = 0; j < R3D.blocks[i].vars.length; j++)
         {
         if(R3D.blocks[i].vars[j].name == "EngineTerrain")
         {	
         $('#devlist').append(R3D.blocks[i].vars[j].name + ' | ' + R3D.blocks[i].vars[j].data.sizex + '/' + R3D.blocks[i].vars[j].data.sizey + '<br/>');
         $('#parkmap').css('width', R3D.blocks[i].vars[j].data.sizex+'px')
         $('#parkmap').css('height', R3D.blocks[i].vars[j].data.sizey+'px');
         }
         }
         $('#devlist').append('<hr/><br/>');

         }*/
    }

    for (var i = 0; i < R3D.blocks.length; i++) {
        if (R3D.clasdefinitions[R3D.blocks[i].classprototype].name == 'PathTile') {
            var posx = -1, posy = -1;
            for (var j = 0; j < R3D.blocks[i].vars.length; j++) {
                if (R3D.blocks[i].vars[j].name == "ColIndex") {
                    posx = R3D.blocks[i].vars[j].data;
                } else if (R3D.blocks[i].vars[j].name == "RowIndex") {
                    posy = R3D.blocks[i].vars[j].data;
                }
            }
            SetRelPixel(mapdata, posx * (mapscalefactor), posy * (mapscalefactor), 223, 223, 223, 0xff);
        }
        /* else if(R3D.clasdefinitions[R3D.blocks[i].classprototype].name == 'RCT3Terrain')
         {
         $('#devlist').append('Item ' + (i+1) + ' is an instance of ' + R3D.clasdefinitions[R3D.blocks[i].classprototype].name + '<br/>');

         for(var j = 0; j < R3D.blocks[i].vars.length; j++)
         {
         if(R3D.blocks[i].vars[j].name == "EngineTerrain")
         {	
         $('#devlist').append(R3D.blocks[i].vars[j].name + ' | ' + R3D.blocks[i].vars[j].data.sizex + '/' + R3D.blocks[i].vars[j].data.sizey + '<br/>');
         $('#parkmap').css('width', R3D.blocks[i].vars[j].data.sizex+'px')
         $('#parkmap').css('height', R3D.blocks[i].vars[j].data.sizey+'px');
         }
         }
         $('#devlist').append('<hr/><br/>');

         }*/
    }
    context.putImageData(mapdata, 0, 0);
}
function UpdateProgress(e) {
    //console.log('Called: UpdateProgress()');
    if (e != null) {
        if (e.subtype == 'SetMax') {
            progMax = e.value;
            //$('#procesprogress').attr('max',e.value);
        } else if (e.subtype == 'SetProg') {
            SetProgress(e.value);
            //$('#procesprogress').val(e.value);
        } else if (e.subtype == 'SetStatus') {
            $('#status').html('Current status: ' + e.value);
        }
    } else {
        $('#status').html('');
    }
}

$(document).ready(function (e) {
    if (!window.chrome) {
        alert("This application is developed for Google Chrome (tested on v28). It might not work for your browser :(");
    }
    if (!!!window.Worker) {
        $('body').html("This tool requires features your browser doesn't support. Upgrade to Chrome or Firefox to start make use of them!");
    }
    if (!!FileReader && HasDragAndDrop()) {
        $('#dropzone').on('dragover', function (e) {
            e.stopPropagation();
            e.preventDefault();
            $(this).css('background-color', 'green');
            $('#droptext').html('You can now drop the file');
        });
        $('#dropzone').on('dragleave', function (e) {
            e.stopPropagation();
            e.preventDefault();
            $(this).css('background-color', 'none');
            $('#droptext').html('Drop your parkfile.dat here');
        });

        var dropZone = document.getElementById('dropzone');
        dropZone.addEventListener('drop', HandleDrop, false);
    } else {
        $('#dropzone').hide();
    }
    $('#btn_load').on('click', function () {
        document.getElementById('btn_file').click();
        /*var files = document.getElementById('btn_file').files;
         if (!files.length) {
         alert("You must select a file first!");
         return;
         }
         HandleDrop(files);*/
    });

    $('#btn_file').on('change', function () {
        var files = document.getElementById('btn_file').files;
        if (!files.length) {
            alert("You must select a file first!");
            return;
        }
        HandleDrop(files);
    });

    $('#btn_save_file').on('click', function (e) {
        SaveParkFile();
    });

    $('#btn_unused_items').on('click', function (e) {
        e.preventDefault();
        SelectPredefinedUnusedItems(e);
    });

    $('#cleanup_guests').on('click', function (e) {
        e.preventDefault();
        SelectGuest(e);
    });
    $('#cleanup_ducks').on('click', function (e) {
        e.preventDefault();
        SelectDuck(e);
    });

    $('#btn_deselect').on('click', function (e) {
        e.preventDefault();
        DeselectItems(e);
    });

    $("#btn_parkmap_show").on('click', function () {
        $("#parkmap_holder").show();
        window.scrollTo(0, 0);
        // $(window).scrollTop();
    });
    $("#btn_parkmap_hide").on('click', function () {
        $("#parkmap_holder").hide();
    });
});


/*-=-=-=-=-=-=-==-=
 Layout
 -=-=-=-=-=-=-==-=*/
function GUIEnabled(bool) {
    if (!bool) {
        $('.guienable_btn').attr('disabled', 'disabled');
    } else {
        $('.guienable_btn').removeAttr('disabled');
    }
    v_GUIEnabled = bool;
    if (bool) {
        ShowNotification('icon.png', 'Park CleanUp lite ready', 'Feel free to continue your work!');
        progMax = 100;
        SetProgress(0);
    }
}

function SetProgress(val) {
    $('#procesprogress').css("width", "" + ((val / progMax) * 100) + "%");
}

function ShowStatus(bool) {
    if (!bool) {
        progMax = 100;
        SetProgress(0);
        $('#fixed_progress').hide();
        $('#statusbar').hide();
    } else {
        $('#fixed_progress').show();
        $('#statusbar').show();
    }
}

function ShowNotification(icon, title, message) {
    try {
        sendNotification(icon, title, message, 5000, true);
    } catch (e) {

    }
}

var sendNotification = function sendNotification(image, title, message, timeout, showOnFocus) {
    // Default values for optional params
    timeout = (typeof timeout !== 'undefined') ? timeout : 0;
    showOnFocus = (typeof showOnFocus !== 'undefined') ? showOnFocus : true;

    // Check if the browser window is focused
    var isWindowFocused = document.querySelector(":focus") === null ? false : true;

    // Check if we should send the notification based on the showOnFocus parameter
    var shouldNotify = !isWindowFocused || isWindowFocused && showOnFocus;

    if (window.webkitNotifications && shouldNotify) {
        // Create the notification object
        var notification = window.webkitNotifications.createNotification(image, title, message);

        // Display the notification
        notification.show();

        if (timeout > 0) {
            // Hide the notification after the timeout
            setTimeout(function () {
                notification.cancel()
            }, timeout);
        }
    }
};

/*-=-=-=-=-=-=-==-=
 Processing functions
 -=-=-=-=-=-=-==-=*/
function ReferencesAreSame(refa, refb) {
    if (refa.a == refb.a && refa.b == refb.b)
        return true;
    return false;
}

function IsReferredTo(reference) {
    for (var i = 0; i < R3D.blocks.length; i++) {
        for (var j = 0; j < R3D.blocks[i].references.length; j++) {
            if (ReferencesAreSame(reference, R3D.blocks[i].references[j])) {
                return true;
            }
        }
    }
    return false;
}

function NameIsPredefined(classname) {
    if (classname == 'SIDDatabaseEntry')
        return true;
    if (classname == 'CIDDatabaseEntry')
        return true;
    if (classname == 'CEDDatabaseEntry')
        return true;
    if (classname == 'WAIDatabaseEntry')
        return true;
    if (classname == 'WASDatabaseEntry')
        return true;
    if (classname == 'AIDDatabaseEntry')
        return true;
    if (classname == 'ASDDatabaseEntry')
        return true;
    if (classname == 'PPGDatabaseEntry')
        return true;
    return false;
}

function SelectPredefinedUnusedItems(e) {
    if (R3D == null) {
        alert('You have to load a file first!');
        return;
    }
    GUIEnabled(false);
    SelectionProces(R3D, 'threads/select_unused_predefined.js', SelectItemsByIDList);
}

function SelectDuck(e) {
    if (R3D == null) {
        alert('You have to load a file first!');
        return;
    }
    GUIEnabled(false);
    SelectionProces(R3D, 'threads/select_duck.js', SelectItemsByIDList);
}

function SelectGuest(e) {
    if (R3D == null) {
        alert('You have to load a file first!');
        return;
    }
    GUIEnabled(false);
    SelectionProces(R3D, 'threads/select_guest.js', SelectItemsByIDList);
}

function DeselectItems(e) {
    if (R3D == null) {
        alert('You have to load a file first!');
        return;
    }
    GUIEnabled(false);
    for (var i = 0; i < R3D.blocks.length; i++) {
        $('#checkbox_item' + i).attr('checked', false);
    }
    CalculateNewFileSize(e);
    GUIEnabled(true);
}

function GetBlockCount() {
    var count = R3D.blocks.length;
    for (var i = 0; i < R3D.blocks.length; i++) {
        if ($('#checkbox_item' + i).attr('checked'))
            count--;
    }
    return count;
}

function GetBlockList() {
    var list = new Array();
    for (var i = 0; i < R3D.blocks.length; i++) {
        if ($('#checkbox_item' + i).attr('checked'))
            list.push(i);
    }
    return list;
}

function GetNewFilesize() {
    var size = R3D.size;
    for (var i = 0; i < R3D.blocks.length; i++) {
        if ($('#checkbox_item' + i).attr('checked'))
            size -= (R3D.blocks[i].end - R3D.blocks[i].start);
    }
    return size;
}

function CalculateNewFileSize(e) {
    var size = GetNewFilesize();
    $('#sizeindicator').html(' - New filesize is appox. ~' + BytesStringmaker(size) + '.');
}

//SelectionProces(R3D, 'select_unused_predefined.js', SelectItemsByIDList);
function SelectionProces(R3D, handler, finishcallback) {
    progMax = R3D.blocks.length;
    //$('#procesprogress').attr('max',R3D.blocks.length);
    $('#status').html('Current status: Calculating unused files');
    //$('#procesprogress').val(0);
    SetProgress(0);
    ShowStatus(true);

    var worker = new Worker(handler);
    worker.postMessage(JSON.stringify({data: R3D}));

    worker.onmessage = function (e) {
        var params = JSON.parse(e.data);
        if (params.type == 'Finished') {
            finishcallback(params.IDList);
            GUIEnabled(true);
        } else if (params.type == 'Error') {
            alert('Error: ' + params.msg);
            return;
        } else if (params.type == 'Progress') {
            SetProgress(params.value);
            //$('#procesprogress').val(params.value);
        }
    }
}

function SelectItemsByIDList(e) {
    for (var i = 0; i < e.length; i++) {
        $('#checkbox_item' + e[i]).attr('checked', true);
    }
    CalculateNewFileSize(e);
    ShowStatus(false);
}