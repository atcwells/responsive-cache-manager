var RCI = require('../responsive-cache-interface.js')();

RCI.set({
	foo: 'bar',
	bar: {
		yes : 'no'
	}
});

console.log(RCI.getAll());
console.log(RCI.get('foo'));

console.log(RCI.getStats());

// RCI.flush();
