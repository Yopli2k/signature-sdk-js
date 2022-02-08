var mSigObj;
var mHash;

Module.onRuntimeInitialized = _ => {		
    document.getElementById("version_txt").innerHTML = Module.VERSION;
    mSigObj = new Module.SigObj();	
	mHash = new Module.Hash(Module.HashType.SHA512);	  
	try {
	    mSigObj.setLicence("PUT HERE YOUR LICENCE STRING");   
		document.getElementById("myfile").disabled=false;
		
		if (navigator.hid) {
		    document.getElementById("capture_stu_device").disabled=false;
		}
		document.getElementById("canvas_capture_btn").disabled=false;	
	} catch (e) {
		alert(e);
	}
}

async function loadFromFile() {
	const file = document.getElementById("myfile").files[0];
	if (file) {
	  // check the type	  
	  if ("text/plain" == file.type) {
		  // read the file as string
		  const reader = new FileReader();
          reader.onload = async function() {
            const data = reader.result;
			try {
				if (await mSigObj.setTextData(data)) {
					renderSignature();
				} else {
					alert("Incorrect signature data found");
				}
			} catch (e) {
				alert("Error loading signature as text "+e);
			}
		  }
          reader.readAsText(file);		
	  } else if ((file.type == "image/png") ||
                (file.type == "image/jpeg")) {			  
		const reader = new FileReader();
        reader.onload = async function() {
          const data = reader.result;
		  var img = new Image();	     
		  img.addEventListener('load', async function() {
             //the image has been loaded
			const canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0, img.width, img.height);
			const imageData = ctx.getImageData(0, 0, img.width, img.height);
			try {
				await mSigObj.readEncodedBitmapBinary(imageData.data, imageData.width, imageData.height);
				renderSignature();
			} catch (e) {
				alert("Error loading image "+e);
			}			
          }, false);
		  img.src = data;  
        }
        reader.readAsDataURL(file);		
	  } else {
		  // we assume is binary data
		  const reader = new FileReader();
          reader.onload = async function() {
            const data = reader.result;
			try {
				if (await mSigObj.setSigData(new Uint8Array(data))) {
					renderSignature();
				} else {
					alert("Incorrect signature data found");
				}
			} catch (e) {
				alert("Error loading signature as binary "+e);
			}
		  }
          reader.readAsArrayBuffer(file);		
	  }
	}
}
	
async function renderSignature() {
	//pixels = dpi*mm/25.4mm
	let width = Math.trunc((96*mSigObj.getWidth(false)*0.01)/25.4);
	let height = Math.trunc((96*mSigObj.getHeight(false)*0.01)/25.4);
	
	let scaleWidth = 300/width;
	let scaleHeight = 200/height;
	let scale = Math.min(scaleWidth, scaleHeight);
				
	let renderWidth = Math.trunc(width * scale);
	const renderHeight = Math.trunc(height * scale);
	
	// render with must be multiple of 4
	if (renderWidth % 4 != 0) {
		renderWidth+= renderWidth % 4;
	}
	
	let canvas;
	const inkColor = "#000F55";
	try {
	    const image = await new Promise(function(resolve, reject) {
	        mSigObj.renderBitmap(renderWidth, renderHeight, "image/png", 3.0, inkColor, "#ffffff", 0, 0, 0x400000,
	            resolve,
		        reject,
		        async function(width, height) {
		            canvas = new OffscreenCanvas(width, height);
			        const inkCanvas = await new InkCanvasRaster(canvas, canvas.width, canvas.height);
	                await BrushPalette.configure(inkCanvas.canvas.ctx);

		            window.WILL = inkCanvas;
	                WILL.type = "raster";
			        WILL.setColor(Color.fromHex(inkColor));	        
	                await WILL.setTool("pen");							
			        return inkCanvas;
		        }
	        );
	    });		
	
	    document.getElementById("sig_image").src = image;	
        document.getElementById("sig_text").value = await mSigObj.getTextData(Module.TextFormat.BASE64);	
	} catch (e) {
		alert(e);
	}
				

	await BrushPalette.delete();
	await window.WILL.delete();		
	window.WILL = null;
	delete canvas;
}

function captureFromCanvas() {	
    const config = {};
	config.source = {mouse:document.getElementById("allow_mouse_check").checked,
				     touch:document.getElementById("allow_touch_check").checked, 
					 pen:document.getElementById("allow_pen_check").checked};
					 
	const sigCaptDialog = new SigCaptDialog(config);
	
	sigCaptDialog.addEventListener("ok", function() {
	    renderSignature();
	});
	
	sigCaptDialog.open(mSigObj, null, null, null, Module.KeyType.SHA512, mHash);
	sigCaptDialog.startCapture();			
}

function captureFromSTU() {
    const stuCapDialog = new StuCaptDialog();
	stuCapDialog.addEventListener("ok", function() {
	    renderSignature();
	});				
	stuCapDialog.open(mSigObj, null, null, null, Module.KeyType.SHA512, mHash);					
}