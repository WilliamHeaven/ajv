import type {CodeKeywordDefinition, ErrorObject, KeywordErrorDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {
  checkReportMissingProp,
  checkMissingProp,
  reportMissingProp,
  propertyInData,
  noPropertyInData,
} from "../code"
import {_, str, nil, Name} from "../../compile/codegen"

export type RequiredError = ErrorObject<"required", {missingProperty: string}>

const error: KeywordErrorDefinition = {
  message: ({params: {missingProperty}}) => str`should have required property '${missingProperty}'`,
  params: ({params: {missingProperty}}) => _`{missingProperty: ${missingProperty}}`,
}

const def: CodeKeywordDefinition = {
  keyword: "required",
  type: "object",
  schemaType: "array",
  $data: true,
  error,
  code(cxt: KeywordCxt) {
    const {gen, schema, schemaCode, data, $data, it} = cxt
    const {opts} = it
    if (!$data && schema.length === 0) return
    const useLoop = schema.length >= opts.loopRequired
    if (it.allErrors) allErrorsMode()
    else exitOnErrorMode()

    function allErrorsMode(): void {
      if (useLoop || $data) {
        cxt.block$data(nil, loopAllRequired)
      } else {
        for (const prop of schema) {
          checkReportMissingProp(cxt, prop)
        }
      }
    }

    function exitOnErrorMode(): void {
      const missing = gen.let("missing")
      if (useLoop || $data) {
        const valid = gen.let("valid", true)
        cxt.block$data(valid, () => loopUntilMissing(missing, valid))
        cxt.ok(valid)
      } else {
        gen.if(checkMissingProp(cxt, schema, missing))
        reportMissingProp(cxt, missing)
        gen.else()
      }
    }

    function loopAllRequired(): void {
      gen.forOf("prop", schemaCode, (prop) => {
        cxt.setParams({missingProperty: prop})
        gen.if(noPropertyInData(data, prop, opts.ownProperties), () => cxt.error())
      })
    }

    function loopUntilMissing(missing: Name, valid: Name): void {
      cxt.setParams({missingProperty: missing})
      gen.forOf(
        missing,
        schemaCode,
        () => {
          gen.assign(valid, propertyInData(data, missing, opts.ownProperties))
          gen.ifNot(valid, () => {
            cxt.error()
            gen.break()
          })
        },
        nil
      )
    }
  },
}

export default def