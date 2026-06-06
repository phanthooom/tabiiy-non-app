import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAam7HY4vTF_s7ySXJfh53jnzYYISTy3g8",
  authDomain: "tabiiy-non.firebaseapp.com",
  projectId: "tabiiy-non"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function check() {
  const snapOrders = await getDocs(collection(db, 'orders'))
  console.log("Total orders:", snapOrders.docs.length)
  
  const snapCarts = await getDocs(collection(db, 'carts'))
  console.log("Total carts:", snapCarts.docs.length)
  snapCarts.docs.forEach(d => {
    console.log("CART", d.id, "=>", JSON.stringify(d.data(), null, 2))
  })
}

check().catch(console.error)
