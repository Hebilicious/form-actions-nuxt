import { defineBuildConfig } from "unbuild"

export default defineBuildConfig({
  entries: ["src/module"],
  declaration: true,
  rollup: {
    emitCJS: true
  }
})
