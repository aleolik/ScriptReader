const chokidar = require("chokidar");
const fs = require("fs/promises")
const {join} = require("path")

const availableScripts = {
    "dir" : {
        "callName":"dir",
        "methods" : {
            "make" : "make"
        },
    },
    "file" : {
        "callName":"file",
        "methods" : {
            "delete":"delete",
            "append":"append",
            "create":"create",
        }
    }
};


const modifyErrorText = (message,lineIndex) => {
    return `Error at line:${lineIndex} in script.txt: ${message}`
};

const lineIsComment = function(line) {
    // line starting with ## , counts as comment and won't be handled
    return line.length >= 2 && line.substring(0,2) === "##"
};

const spliceScript = (script,lineIndexInScriptFile) => {
    const result = script.split(" ")
    // result.length must be 3 <= result.length <= 4 , otherwise throw error
    if (result.length < 3) {
        if (result.length === 0) throw new Error (modifyErrorText("callName cant be undefined or null",lineIndexInScriptFile))
        if (result.length === 1) throw new Error(modifyErrorText("operation cant be undefined or null",lineIndexInScriptFile))
        if (result.length === 2) throw new Error(modifyErrorText("path cant be undefined or null",lineIndexInScriptFile))
    }
    if (result.length <= 4) return result // [callName,operation,path] or [callName,operation,path,data],data is a must property in some cases
    // if data property has " " in it,then result.length will be 4+
    // handle logic to return result with length equals 4
    for (let i = 4;i<result.length;i++) {
        // index,where data is stored
        result[3] += " " + result[i]
    }
    return result.slice(0,4)
};

const allLinesAreCorrect = (lines) => {
    for (let i = 0;i<lines.length;i++) {
        const line = lines[i]
        if (lineIsComment(line)) continue; // line is comment,skip it
        try {
            const [callName,operation,path,data] = spliceScript(line,i+1)
            if (!availableScripts[callName]) throw new Error(modifyErrorText(`"${callName}" is not in list of available callNames!`,i+1))
            if (!availableScripts[callName]["methods"][operation]) throw new Error(modifyErrorText(`"${callName} ${operation}" is not available operation!`,i+1))
        } catch (err) {
            console.error(err)
            return false
        }
    }

    return true
};


class Dir {
    static async createDir(path){
        const fullPath = join(__dirname,path)
        const dir = await fs.mkdir(fullPath, { recursive: true });
        console.log(`directory at path:${fullPath} was created!`)
        return dir
    }
}

class File {
    static async createFile(path,data){
        const customErrMsg = "file already exists"
        try {
            const file = await fs.open(path,"r");
            await file.close()
            throw new Error(customErrMsg);
        } catch (e) {
            if (e.message === customErrMsg) throw new Error(e.message) // throw error to higher scope
            try {
                await fs.writeFile(path,data || "",{
                    encoding:'utf-8',
                    flag:"w",
                })
                console.log("file was created")
            } catch (error) {
               throw new Error(e.message)
            }
        }   
    }
    static async appendToFile(path,data){
        if (!data) throw new Error("data cant be null in append method")
        const file = await fs.open(path,"a+");
        await file.appendFile(data)
        console.log("data to file was appended")
    }
    static async deleteFile(path){
        await fs.unlink(path)
        console.log("file was deleted")
    }
}




(async() => {
    // script example : file(callName) create(operation) "./data.txt"(path) content(data)
    try {
        // start watching scripts.txt file
        const watcher = chokidar.watch("./scripts.txt",{
            persistent:true,
            interval:50
        })
        watcher.on("change",async(path) => {
            console.log("change event was emited...")
            // open file
            const fileHandler = await fs.open("./scripts.txt","r");
            // link "error" event to file handler
            fileHandler.on("error",(err) => {
              if (err) console.log("Error :",err)
              fileHandler.close();
            })
            // link "change" event to file handler
            fileHandler.on("change",async() => {
                const size = (await fileHandler.stat()).size
                const buffer = Buffer.alloc(size)
                const [offset,length,postion] = [0,size,0] 
                // read scripts.txt content
                await fileHandler.read(
                    buffer,offset,length,postion
                )
                const lines = buffer.toString().split(/\r?\n/)
                if (!allLinesAreCorrect(lines)) {
                     // no need to throw error,method will log it
                    return fileHandler.emit("error",null)
                };
                let lineIndex = 0
                for (const line of lines) {
                    lineIndex += 1 // we can add at the beginning,because we start from 0 and in .txt files start at 1
                    if (lineIsComment(line)) continue; // line is comment,skip it
                    // line is script,handle it
                    const [callName,operation,path,data] = spliceScript(line)
                    const defaultErrMsg = `Any scenarios exist for : "${callName} ${operation}"`
                    try {
                        // if line has operation related to file
                        if (availableScripts.file.callName === callName) {
                            switch (operation) {
                                case availableScripts.file.methods.create:
                                    await File.createFile(path,data);
                                    break;
                                case availableScripts.file.methods.append:
                                    await File.appendToFile(path,data);
                                    break;
                                case availableScripts.file.methods.delete:
                                    await File.deleteFile(path);
                                    break;
                                default:
                                    /*
                                        default will only work if there is availableScripts[callName] and availableScripts[callName][operation],
                                        but there is no scenario in switch block
                                    */
                                    return fileHandler.emit("error",defaultErrMsg)
                            }
                        }
                        // if line has operation related to dir
                        if (availableScripts.dir.callName === callName) {
                            switch (operation) {
                                case availableScripts.dir.methods.make:
                                    await Dir.createDir(path);
                                    break;
                                default:
                                    /*
                                        default will only work if there is availableScripts[callName] and availableScripts[callName][operation],
                                        but there is no scenario in switch block
                                    */
                                    return fileHandler.emit("error",defaultErrMsg)
                            }
                        }
                    } catch (e) {
                        // error found,close file connection
                        const errMsg = modifyErrorText(e.message,lineIndex)
                        return fileHandler.emit("error",errMsg)
                    }
                }
                // everything worked fine,close file connection
                fileHandler.close();
            })
            // emit change event for file handler
            fileHandler.emit("change")
        })
        console.log("Events on script.txt file were set\nLooking for changes...")    
    } catch (e) {
        console.error("caught error",e.message)
    }
})();
