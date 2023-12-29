// // Esta función toma un arreglo de objetos con sus probabilidades y devuelve uno de ellos al azar
// function roulette (objects) {
//   // Calculamos la suma total de las probabilidades
//   let total = 0;
//   for (let obj of objects) {
//     total += obj.probability;
//   }
//   // Generamos un número aleatorio entre 0 y el total
//   let random = Math.random () * total;
//   // Recorremos el arreglo de objetos y vamos acumulando sus probabilidades
//   let acum = 0;
//   for (let obj of objects) {
//     acum += obj.probability;
//     // Si el número aleatorio es menor o igual al acumulado, elegimos ese objeto
//     if (random <= acum) {
//       return obj;
//     }
//   }
// }

// // Ejemplo de uso
// let fruits = [
//   {name: "apple", probability: 0.2},
//   {name: "banana", probability: 0.3},
//   {name: "orange", probability: 0.4},
//   {name: "lemon", probability: 0.1}
// ];

// let chosen = roulette (fruits);
// console.log (chosen.name); // Imprime el nombre de la fruta elegida

var hola = "🐾 Small Fertilizer"

console.log(hola.split(" ").splice(1).join(" ").toLowerCase())