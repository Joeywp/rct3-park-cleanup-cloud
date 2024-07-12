
// NOT USED ANYMORE!

importScripts("../jdataview.js");

onmessage = function (e)
{
	var params = JSON.parse(e.data);
	if(params == null)
	{
		postMessage(JSON.stringify({type:'Error', msg:'No file loaded!'}));
		return;
	}
	var R3D = params.R3D;
	
	var currentDATFile = new Uint8Array(params.currentDATFile).buffer
	var buf = new Uint8Array(params.buf).buffer;
	
	var originalFile = new jDataView(currentDATFile);
	originalFile._littleEndian = true;
	
	var newFile = new jDataView(buf);
	newFile._littleEndian = true;
	
	postMessage(JSON.stringify({type:'Finished'/*, IDList:list*/}));
}