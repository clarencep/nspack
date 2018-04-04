

class A {
    constructor() {
        this._a = "A"
    }
    hi() {
        console.log("Hello from A");
    }
}

// class B extends A {
//     constructor() {
//         super()
//         this._b = "B"
//     }
//     hi() {
//         console.log("Hello from B");
//     }
// }

// function A(){
//     this._a = 'A'
// }

// Object.assign(A.prototype, {
//     hi(){
//         console.log("Hello from A");
//     }
// })

function B(){
    A.call(this)
    this._b = 'B'
}

B.prototype = Object.create(A.prototype)

Object.assign(B.prototype, {
    hi(){
        console.log("Hello from B");
    }
})


var a = new A()
a.hi();
console.log("a instanceof A: ", a instanceof A);

var b = new B()
b.hi();
console.log("b instanceof A: ", b instanceof A);
console.log("b instanceof B: ", b instanceof B);

