importScripts("../jdataview.js");
importScripts("archive.js");

function CalculateProgress(cur,tot)
{
	// 100 vervangen met tot?
	return (cur/tot)*100;
}

function ReadVariableDeclaration(f, r3vd)
{
	var len = 0;
	len = f.getUint16(f.tell());
	r3vd.name = f.getString(len, f.tell());
	
	len = f.getUint16(f.tell());
	r3vd.datatype = f.getString(len, f.tell());
	
	r3vd.typesize = f.getUint32(f.tell());
	
	r3vd.subvarcount = f.getUint32(f.tell());
	
	for(var j = 0; j < r3vd.subvarcount; j++)
	{
		var r3vd2 = new R3VariableDef();
		ReadVariableDeclaration(f, r3vd2);
		r3vd.subvars.push(r3vd2);
	}
}

function ReadVariableData(f, variabledef, r3bp)
{
	var len = 0;
	var arrayitems = 0;
	var size = 0;
	var origin = f.tell();
	try{
		var vd = new VariableData();
		vd.name = variabledef.name;
		vd.vartype = variabledef.datatype;
		if(variabledef.datatype == 'int32')
		{
			//f.seek(f.tell() + 4);
			vd.data = f.getUint32(f.tell());
			r3bp.vars.push(vd);
		} else if(variabledef.datatype == 'uint32')
		{
			vd.data = f.getUint32(f.tell());
			r3bp.vars.push(vd);
		} else if(variabledef.datatype == 'float32')
		{
			vd.data = f.getUint32(f.tell());
			r3bp.vars.push(vd);
		} else if(variabledef.datatype == 'bool')
		{
			f.seek(f.tell() + 1);
		} else if(variabledef.datatype == 'lebool')
		{
			var lebool = f.getUint32(f.tell());
			if(lebool > 0){
				f.seek(f.tell() + lebool);
			}
				// throw "";
		} else if(variabledef.datatype == 'reference' || variabledef.datatype == 'managedobjectptr')
		{
			var ref = new R3Reference();
			ref.a = f.getUint32(f.tell());
			ref.b = f.getUint32(f.tell());
			r3bp.references.push(ref);
		} else if(variabledef.datatype == 'bool')
		{
			f.seek(f.tell() + 1);
		} else if(variabledef.datatype == 'string')
		{
			len = f.getUint32(f.tell());
			var curplace = f.tell();
			f.seek(curplace + 4);
			//postMessage(JSON.stringify({type:'Warning', msg:'StringSize' + len}));
			vd.data = f.getString(len-4, f.tell());
			r3bp.vars.push(vd);
			f.seek(curplace + len);
		} else if(variabledef.datatype == 'resourcesymbol')
		{
			len = f.getUint32(f.tell());
			f.seek(f.tell() + len);
		} else if(variabledef.datatype == 'uint8')
		{
			vd.data = f.getUint8(f.tell());
			r3bp.vars.push(vd);
		} else if(variabledef.datatype == 'int8')
		{
			f.seek(f.tell() + 1);
		} else if(variabledef.datatype == 'vector3')
		{
			f.seek(f.tell() + 12);
		} else if(variabledef.datatype == 'orientation')
		{
			f.seek(f.tell() + 12);
			
		} else if(variabledef.datatype == 'pathnodearray')
		{
			len = f.getUint32(f.tell());
			f.seek(f.tell() + len);
		} else if(variabledef.datatype == 'BlockingScenery')
		{
			len = f.getUint32(f.tell());
			f.seek(f.tell() + len);
		} else if(variabledef.datatype == 'graphedValue')
		{
			size = f.getUint32(f.tell());
			len = f.getUint32(f.tell());
			len = f.getUint32(f.tell());
			len = f.getUint32(f.tell());
			f.seek(f.tell() + (len*4));
		} else if(variabledef.datatype == 'GE_Terrain')
		{
			size = f.getUint32(f.tell());
			vd.data = {sizex:f.getUint8(f.tell()), sizey:f.getUint8(f.tell())};
			r3bp.vars.push(vd);
			
			f.seek(origin + size + 4);
		} else if(variabledef.datatype == 'managedImage')
		{
			size = f.getUint32(f.tell());
			f.seek(f.tell() + 12);
			size = f.getUint32(f.tell());
			f.seek(f.tell() + (size*4));
		} else if(variabledef.datatype == 'SkirtTrees')
		{
			len = f.getUint32(f.tell());
			f.seek(f.tell() + len);
		} else if(variabledef.datatype == 'PathTileList')
		{
			size = f.getUint32(f.tell());
			if(size != 0)
				postMessage(JSON.stringify({type:'Warning', msg:'PathTileList is greater than 0, the result of this might crash the reader:'}));
			f.seek(f.tell() + size);		
		} else if(variabledef.datatype == 'WaterManager')
		{
			size = f.getUint32(f.tell());
			f.seek(f.tell() + size);
		} else if(variabledef.datatype == 'flexicachelist')
		{
			size = f.getUint32(f.tell());
			f.seek(f.tell() + size);
		} else if(variabledef.datatype == 'waypointlist')
		{
			size = f.getUint32(f.tell());
			f.seek(f.tell() + size);
		} else if(variabledef.datatype == 'matrix44')
		{
			f.seek(f.tell() + 16*4);
			
		} else if(variabledef.datatype == 'array')
		{
			size = f.getUint32(f.tell());
			arrayitems = f.getUint32(f.tell());
		} else if(variabledef.datatype == 'list')
		{
			size = f.getUint32(f.tell());
			arrayitems = f.getUint32(f.tell());
		} else if(variabledef.datatype == 'struct')
		{
			if(variabledef.typesize > 0){
				size = variabledef.typesize;
			} else {
				size = f.getUint32(f.tell());
			}		
		} else {
			throw "The type " + variabledef.datatype + ' is not know by Park CleanUp, file loading has been cancelled to prevent file corruption!';
		}
		
		if(variabledef.datatype == 'struct')
		{
			var curplace = f.tell();
			for(var j = 0; j < variabledef.subvars.length; j++)
			{
				ReadVariableData(f, variabledef.subvars[j], r3bp);	
			}
			f.seek(curplace + size);
		} else if(variabledef.datatype == 'array')
		{
			f.seek(f.tell() + size - 4);
		} else if(variabledef.datatype == 'list')
		{
			f.seek(f.tell() + size - 4);
		} else {
			//postMessage(JSON.stringify({type:'Warning', msg:'Subvariables:'}));
			for(var j = 0; j < variabledef.subvars.length; j++)
			{
				ReadVariableData(f, variabledef.subvars[i], r3bp);	
			}
		}
	} catch (e)
	{
		throw variabledef.datatype + '|' + e;	
	}
}

onmessage = function (e) {
	try
	{
		postMessage(JSON.stringify({type:'Progress', subtype:'SetMax', value:100}));
		postMessage(JSON.stringify({type:'Progress', subtype:'SetProg', value:0}));
		postMessage(JSON.stringify({type:'Progress', subtype:'SetStatus', value:'Reading headers'}));		
		var params = JSON.parse(e.data);		
		var R3D = new R3ArchiveData;
		R3D.size = params.size;
		R3D.file = params.fileobj;
		var f = new jDataView(params.data);
		f._littleEndian = true;
		var len = 0;
	
		var magic = f.getUint32(f.tell());	
		var magic2 = f.getUint32(f.tell());
		if(magic == 0 && magic2 == 0)
		{			
			R3D.versionUnknowns[0] = f.getUint8(f.tell());
			R3D.versionUnknowns[1] = f.getUint8(f.tell());
			R3D.versionUnknowns[2] = f.getUint8(f.tell());
			R3D.versionUnknowns[3] = f.getUint8(f.tell());
			
			var h_size = f.getUint32(f.tell());
			
			
			f.seek(f.tell() + (12*4))
			//for(var i = 0; i < 12; i++)
			//{
				//f.getUint32(f.tell());
			//}
			
			if(R3D.versionUnknowns[0] == 42)
			{
				f.seek(f.tell() + (4*4));
			}
			
		} else if(magic == 0)
		{
			throw 'File is empty';
		} else {
			f.seek(0);
		}
		postMessage(JSON.stringify({type:'Progress', subtype:'SetProg', value:CalculateProgress(f.tell(), params.size)}));
		postMessage(JSON.stringify({type:'Progress', subtype:'SetStatus', value:'Reading classdefinitions'}));
		
		var count_classDefinitions = f.getUint32(f.tell());
		for(var i = 0; i < count_classDefinitions; i++)
		{
			if(i%10 == 0)
			{
				postMessage(JSON.stringify({type:'Progress', subtype:'SetProg', value:CalculateProgress(f.tell(), params.size)}));
			}
			var r3ch = new R3ClassDefHeader();
			r3ch.start = f.tell();
			len = f.getUint16(f.tell());
			r3ch.name = f.getString(len, f.tell());
			r3ch.root_variable_count = f.getUint32(f.tell());
			for(var j = 0; j < r3ch.root_variable_count; j++)
			{
				var r3vd = new R3VariableDef();
				ReadVariableDeclaration(f, r3vd);
				r3ch.variabledefinitions.push(r3vd);
			}
			r3ch.end = f.tell();
			R3D.clasdefinitions.push(r3ch);
		}
		
		postMessage(JSON.stringify({type:'Progress', subtype:'SetStatus', value:'Reading data'}));
		
		var count_dataBlocks = f.getUint32(f.tell());
		for(var i = 0; i < count_dataBlocks; i++)
		{
			if(i%10 == 0)
			{
				postMessage(JSON.stringify({type:'Progress', subtype:'SetProg', value:CalculateProgress(f.tell(), params.size)}));
			}
			var r3bp = new R3BlockPointer();
			r3bp.start = f.tell();
			
			var r3dh = new R3DataHeader();
			r3dh.classprototype = f.getUint32(f.tell());
			r3dh.reference.a = f.getUint32(f.tell());
			r3dh.reference.b = f.getUint32(f.tell());
			
			for(var j = 0; j < R3D.clasdefinitions[r3dh.classprototype].root_variable_count; j++)
			{
				try{
					ReadVariableData(f, R3D.clasdefinitions[r3dh.classprototype].variabledefinitions[j], r3bp);
				} catch (e)
				{
					throw 'Variable reading error ' + e;
				}
			}
			
			r3bp.classprototype = r3dh.classprototype;
			
			r3bp.blockreference = r3dh.reference;
			r3bp.name = R3D.clasdefinitions[r3dh.classprototype].name;
			r3bp.end = f.tell();
			R3D.blocks.push(r3bp);
		}
		
		postMessage(JSON.stringify({type:'Progress', subtype:'SetStatus', value:'Preparing item list'}));
		postMessage(JSON.stringify({type:'Finished', msg:'Reading finished!', r3data:R3D}));
	} catch(e)
	{
		//throw e;
		postMessage(JSON.stringify({type:'Error', msg:e}));
	}
}