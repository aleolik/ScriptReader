const {spliceScript} = require("../../fileReader")
describe("spliceScript",() => {
    it("correct splice data provided,but script without 'data' property",() => {
        const script = ["dir","make","dir"]
        const result = spliceScript(script.join(" "))
        expect(result.length).toBe(3)
        expect(result).toEqual(expect.arrayContaining(script))
    })
    it("correct splice data provided,but with 'data' property",() => {
        const script = ["file","append","dir/file.txt","data"]
        const result = spliceScript(script.join(" "))
        expect(result.length).toBe(4)
        expect(result).toEqual(expect.arrayContaining(script))
    }),
    it("correct splice data provided,but with 'data' property and data has ' ' in it",() => {
        const script = ["file","append","dir/file.txt","data data data data !"]
        const result = spliceScript(script.join(" "))
        expect(result.length).toBe(4) // no data was provided
        expect(result).toEqual(expect.arrayContaining(script))
    }),
    it("wrong data provided(script.length is less than 3),throw error",() => {
        const scriptLengthZero = []
        const scriptLengthOne = ["file"]
        const scriptLengthTwo = ["file","append"]
        expect(() => {
            spliceScript(scriptLengthZero.join(" ")
        )}).toThrow()
        expect(() => {
            spliceScript(scriptLengthOne.join(" ")
        )}).toThrow()
        expect(() => {
            spliceScript(scriptLengthTwo.join(" ")
        )}).toThrow()
    })
})