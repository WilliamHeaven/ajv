function (data, dataType, dataPath) {
  'use strict';

  var errs = validate.errors.length;

  {{~ it.schema:$schema:$i }}
    {{ 
      var $it = it.copy(it);
      $it.schema = $schema;
      $it.schemaPath = it.schemaPath + '[' + $i + ']';
    }}

    var valid = ({{= it.validate($it) }})(data, dataType, dataPath);

    if (valid) {
      validate.errors.length = errs;
      return true;
    }
  {{~}}

  return false;
}