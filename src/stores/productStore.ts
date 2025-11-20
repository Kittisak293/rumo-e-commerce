import { Loading } from "quasar"
import { ref } from "vue"

export const useProductStore = defineStore('product', () => {
  const product = ref<Product[]>([])

  async function addProduct(p: CSSMathProduct, file: File | null) {
    try {
      Loading.show()
      const formData = new FormData()
      formData.append('name', p.name)
    }
  }
}])
