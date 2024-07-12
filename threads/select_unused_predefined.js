function ReferencesAreSame(refa, refb) {
    if (refa.a == refb.a && refa.b == refb.b)
        return true;
    return false;
}

function IsReferredTo(reference, R3D) {
    for (var i = R3D.blocks.length; i--;)
        //for(var i = 0; i < R3D.blocks.length; i++)
    {
        for (var j = R3D.blocks[i].references.length; j--;)
            //for(var j = 0; j < R3D.blocks[i].references.length; j++)
        {
            if (reference.a == R3D.blocks[i].references[j].a && reference.b == R3D.blocks[i].references[j].b)
            //if(ReferencesAreSame(reference, R3D.blocks[i].references[j]))
            {
                return true;
            }
        }
    }
    return false;
}

function NameIsPredefined(classname) {
    if (classname === 'SIDDatabaseEntry')
        return true;
    else if (classname === 'CIDDatabaseEntry')
        return true;
    else if (classname === 'CEDDatabaseEntry')
        return true;
    else if (classname === 'WAIDatabaseEntry')
        return true;
    else if (classname === 'WASDatabaseEntry')
        return true;
    else if (classname === 'AIDDatabaseEntry')
        return true;
    else if (classname === 'ASDDatabaseEntry')
        return true;
    else if (classname === 'PPGDatabaseEntry')
        return true;
    return false;
}

onmessage = function (e) {
    var list = new Array();
    var params = JSON.parse(e.data);
    if (params.data == null) {
        postMessage(JSON.stringify({type: 'Error', msg: 'No file loaded!'}));
        return;
    }
    var R3D = params.data;

    for (var i = 0; i < R3D.blocks.length; i++) {
        if (NameIsPredefined(R3D.blocks[i].name)) {
            if (!IsReferredTo(R3D.blocks[i].blockreference, R3D))
                list.push(i);
        }
        if (i % 75 == 0)
            postMessage(JSON.stringify({type: 'Progress', value: i}));
    }

    postMessage(JSON.stringify({type: 'Finished', IDList: list}));
}