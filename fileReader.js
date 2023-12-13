const chokidar = require("chokidar");
const fs = require("fs/promises")
const {join} = require("path")


const logError = (message,lineIndex) => {
    console.error(`rror at line:${lineIndex}: ${message}`)
}

const lineIsComment = function(line="") {
    // line starting with ## , counts as comment and won't be handled
    return line.length >= 2 && line.substring(0,2) === "##"
}

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

const spliceScript = (script) => {
    // result.length must be 3 <= result.length <= 4
    const result = script.split(" ")
    if (result.length < 3) return result // wrong data,do nothing
    if (result.length === 3) return result // [callName,operation,path]
    if (result.length === 4) return result // [callName,operation,path,data]
    // if data property has " " in it,then result.length will be 4+
    // handle logic to return result with length equals 4
    for (let i = 4;i<result.length;i++) {
        // index,where data is stored
        result[3] += " " + result[i]
    }
    return result.slice(0,4)
}

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
        if (!data) throw new Error("data cant be null")
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
            // link change event to file handler
            fileHandler.on("change",async() => {
                const size = (await fileHandler.stat()).size
                const buffer = Buffer.alloc(size)
                const [offset,length,postion] = [0,size,0] 
                // read scripts.txt content
                await fileHandler.read(
                    buffer,offset,length,postion
                )
                const lines = buffer.toString().split(/\r?\n/)
                let lineIndex = 0
                for (const line of lines) {
                    lineIndex += 1 // we can add at the beginning,because we start from 0 and in .txt files start at 1
                    if (lineIsComment(line)) continue; // line is comment,skip it
                    // line is script,handle it
                    const [callName,operation,path,data] = spliceScript(line) // data can be null in some cases (delete file/dir;create file without content,etc...)
                    if (!callName) return console.log(`callName cant be undefined or null at line:${lineIndex}`)
                    if (!operation) return console.log(`operation cant be undefined or null at line:${lineIndex}`)
                    if (!path) return console.log(`path cant be undefined or null at line:${lineIndex}`)
                    // if line has operation related to file
                    if (availableScripts.file.callName === callName) {
                        switch (operation) {
                            case availableScripts.file.methods.create:
                                try {
                                    await File.createFile(path,data)
                                } catch (e) {
                                    return logError(e.message,lineIndex)
                                } finally {
                                    break;
                                }
                            case availableScripts.file.methods.append:
                                try {
                                    await File.appendToFile(path,data)
                                } catch (e) {
                                    return logError(e.message,lineIndex)
                                } finally {
                                    break;
                                }
                            case availableScripts.file.methods.delete:
                                try {
                                    await File.deleteFile(path)
                                } catch (e) {
                                    return logError(e.message,lineIndex)
                                } finally {
                                    break;
                                }
                            default:
                                return logError(`${operation} file is not in list of allowed operations`,lineIndex)
                        }
                    }
                   // if line has operation related to dir
                    else if (availableScripts.dir.callName === callName) {
                        switch (operation) {
                            case availableScripts.dir.methods.make:
                                try {
                                    await Dir.createDir(path)
                                } catch (e) {
                                    return logError(e.message,lineIndex)
                                } finally {
                                    break;
                                }
                            default:
                                return logError(`${operation} dir is not in list of allowed operations`,lineIndex)
                        }
                    }
                }
            await fileHandler.close()
        })
        // emit change event for file handler
        fileHandler.emit("change")
        })
        console.log("App running\nLooking for scripts.txt changes...")    
    } catch (e) {
        return logError(e.message)
    }
})();
