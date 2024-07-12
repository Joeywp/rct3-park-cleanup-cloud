//Bitflags
const PRE_ITEMLIST = 1;

function R3VariableDef()
{
	this.name = '';
	this.datatype = '';
	this.typesize = '';
	this.subvarcount = '';	
	this.subvars = new Array();
}

function R3ClassDefHeader()
{
	this.name = '';
	this.root_variable_count = '';
	this.variabledefinitions = new Array();//R3VariableDef
	this.start = 0;
	this.end = 0;
}

function R3Reference()
{
	this.a = 0;
	this.b = 0;	
}

function R3DataHeader()//For temporary use, previously used for non-temporary jobs
{
	this.classprototype = 0;
	this.reference = new R3Reference();	
}

function VariableData()
{
	this.name = null;
	this.vartype = null;
	this.data = null;
	//this.vars = new Array();
}

function R3BlockPointer()
{
	this.name = '';
	this.start = 0;
	this.end = 0;
	this.blockreference = new R3Reference();	
	this.references = new Array();//R3Reference
	this.classprototype = -1;
	this.vars = new Array();//VariableData
}

function R3ArchiveData()
{
	this.clasdefinitions = new Array();//R3ClassDefHeader
	this.blocks = new Array();//R3BlockPointer
	this.versionUnknowns = new Array(4);//Uint32
	this.size = 0;
	this.file = null;
}

function StartParsingArchive(file, callback, progressupdate, errorcallback, preflags)
{
	var reader = new FileReader();
	
	progressupdate(JSON.stringify({type:'Progress', subtype:'SetStatus', value:'Preparing'}));
	
	reader.onloadend = function(evt) {
		//var R3D = null;
		if (evt.target.readyState == FileReader.DONE) { // DONE == 2
			var worker = new Worker("r3archive/loader.js");
			worker.postMessage(JSON.stringify({data:evt.target.result, size:file.size, fileobj:file}));
			
			worker.onmessage = function (e) {
				var params = JSON.parse(e.data);
				if(params.type == 'Finished')
				{
					if(preflags & PRE_ITEMLIST)
					{
						var precreatedList = '';
						for(var i = 0; i < params.r3data.blocks.length; i++)
						{
							precreatedList += '<input type="checkbox" id="checkbox_item' + i +'" class="itemcheckbox control checkbox" /><label class="itemlabel" for="checkbox_item' + i +'">' + (params.r3data.blocks[i].name + ' UID:' + params.r3data.blocks[i].blockreference.a +'-'+ params.r3data.blocks[i].blockreference.b + '</label><br/>');
						}											
					}
					callback(params.r3data, precreatedList, preflags);
									
				} else if(params.type == 'Error')
				{
					//alert('Error: ' + params.msg);
					errorcallback(params);
				} else if(params.type == 'Warning')
				{
					alert('Warning: ' + params.msg);
				} else if(params.type == 'DebugUpdate')
				{
					alert('Debug: ' + params.msg);
				} else if(params.type == 'Progress')
				{					
					progressupdate(params);
				}
			}
	  	}
	};	
	
	if (file.slice) {
		var blob = file.slice(0, file.size);
	} else if (file.mozSlice) {
		var blob = file.mozSlice(0, file.size);
	}
	reader.readAsBinaryString(blob);
}