const {allLinesAreCorrect,} = require("../../fileReader")
describe("allLinesAreCorrect",() => {
    it("lines is empty array",() => {
       const result = allLinesAreCorrect([])
       expect(result).toBe(true)
    })
    it("Wrong lines in  array",() => {
        const lines = []
        lines.push("")
        lines.push("badLine")
        lines.push("bad line")
        for (const line of lines) {
            const result = allLinesAreCorrect([line])
            expect(result).toBe(false)
        }
     }),
     it("Correct provided lines",() => {
        const lines = []
        lines.push("file append path data")
        lines.push("dir make dir")
        lines.push("file create newFile")
        const result = allLinesAreCorrect(lines)
        expect(result).toBe(true)
     }),
     it("Correct provided lines with commentaries",() => {
        const lines = []
        lines.push("## comm1")
        lines.push("file append path data")
        lines.push("dir make dir")
        lines.push("file create newFile")
        lines.push("## comm2")
        const result = allLinesAreCorrect(lines)
        expect(result).toBe(true)
     })
})