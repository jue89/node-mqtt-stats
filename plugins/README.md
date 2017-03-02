# Plugins

Must expose a function that will be called by the main program:

``` javascript
//my_metric.js
module.exports = function( config, mqtt ) {
	// ...
}
```

## Parameter: ```config```

Object within the config.js named with the module's name. Example config.js:

``` javascript
{
  "other": { ... },
  "my_metric": { "my_option": true }
};
```
will result in:
``` javascript
config = {
	"my_option": true
};
```

## Parameter: ```mqtt```

Expose a publish function:
``` javascript
mqtt.publish( [endpoint], [timestamp], value );
```
Parameters:
 * ```endpoint```: will be prefixed with FQDN of the host and the metrics name. (optional)
 * ```timestamp```: Date object. If omitted the current time is transmitted.
 * ```value```: Value to be transmitted.

Example for my_metric.js on example.com:
``` javascript
mqtt.publish( 'test', new Date(), 1.2 );
// -> com/example/my_metric/test: 1488483542874,1.2
mqtt.publish( 'test/foo', 1.2 );
// -> com/example/my_metric/test/foo: 1488483542874,1.2
mqtt.publish( 1.2 );
// -> com/example/my_metric: 1488483542874,1.2
```

}
