<template>
  <div class="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4">
      <!-- Header -->
      <div class="mb-8">
        <img src="../assets/paratus-logo.png" class="w-25" alt="" />
        <div class="flex items-center gap-3 mb-4">
          <div>
            <h1 class="text-xl font-bold text-gray-900">Exchange Rates</h1>
            <p class="text-gray-600">
              Compare our rates with your favourite apps below and see the difference
            </p>
          </div>
        </div>
      </div>

      <!-- Rate Date -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6 text-center">
        <p class="text-sm text-gray-600">
          Rates effective
          <span class="font-semibold text-gray-900">{{ formatDate(selectedDate) }}</span>
        </p>
      </div>

      <!-- Send Money Direction Tabs -->
      <div class="mb-6">
        <div class="flex gap-3 bg-white rounded-lg shadow-sm p-1 w-fit">
          <button
            @click="direction = 'NGN_TO_FOREIGN'"
            :class="[
              'px-6 py-3 rounded-md font-semibold transition-all',
              direction === 'NGN_TO_FOREIGN'
                ? 'bg-red-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            ]"
          >
            <i class="fas fa-arrow-right mr-2"></i>Send from Nigeria
          </button>
          <button
            @click="direction = 'FOREIGN_TO_NGN'"
            :class="[
              'px-6 py-3 rounded-md font-semibold transition-all',
              direction === 'FOREIGN_TO_NGN'
                ? 'bg-red-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            ]"
          >
            <i class="fas fa-arrow-left mr-2"></i>Send to Nigeria
          </button>
        </div>
      </div>

      <!-- Exchange Rates by Counterparty -->
<div v-if="loading" class="text-center py-12">
  <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
</div>

<div v-else-if="filteredRatesByCounterparty.length" class="space-y-6">

  <!-- ========================================= -->
  <!-- PARATUS - ALWAYS FIRST -->
  <!-- ========================================= -->
  <div
    v-if="paratusGroup"
    class="rounded-xl overflow-hidden transition-all duration-300 bg-white shadow-xl border-2 border-red-600"
  >
    <!-- HEADER -->
    <div class="p-5 bg-gradient-to-r from-red-600 to-red-700 text-white">
      <div class="flex items-center gap-3">
        <div
          class="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-white"
        >
          <img
            v-if="paratusGroup.counterparty.logo_url"
            :src="paratusGroup.counterparty.logo_url"
            :alt="paratusGroup.counterparty.name"
            class="w-full h-full object-contain p-1"
          />

          <span v-else class="text-gray-500 font-bold text-lg">
            {{ paratusGroup.counterparty.name?.charAt(0) }}
          </span>
        </div>

        <div class="flex-1">
          <h3 class="text-xl font-bold">
            {{ paratusGroup.counterparty.name }}
          </h3>
        </div>
      </div>
    </div>

    <!-- RATES -->
    <div class="p-6">
      <div class="space-y-3">
        <div
          v-for="rate in paratusGroup.rates"
          :key="rate.id"
          class="flex items-center justify-between p-4 rounded-lg bg-gray-50"
        >
          <!-- Currency Pair -->
          <div class="flex-1">
            <div class="font-semibold text-gray-900">
              {{ rate.currency_pair.from_currency }}
              <span class="mx-1 text-gray-400">→</span>
              {{ rate.currency_pair.to_currency }}
            </div>

            <div class="text-xs mt-1 text-gray-500">
              {{ formatDirection(rate.direction) }}
            </div>
          </div>

          <!-- Rate -->
          <div class="text-right">
            <div class="text-2xl font-bold font-mono text-red-600">
              {{ Number(rate.rate) }}
            </div>

            <div class="text-xs mt-1 text-gray-500">
              per 1 {{ rate.currency_pair.from_currency }}
            </div>
          </div>
        </div>
      </div>

      <!-- PARATUS ACTION -->
      <button
        @click="sendMoneyWithParatus(paratusGroup)"
        class="w-full mt-6 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
      >
        <i class="fab fa-whatsapp text-lg"></i>
        Send Money with {{ paratusGroup.counterparty.name }}
      </button>
    </div>
  </div>


  <!-- ========================================= -->
  <!-- CURRENCY CONVERTER -->
  <!-- ========================================= -->
  <div class="bg-white rounded-lg shadow-lg p-6">
    <h2 class="text-xl font-bold text-gray-900 mb-6">
      Currency Converter
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

      <!-- From Currency -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          From
        </label>

        <input
          v-model.number="converterForm.fromAmount"
          type="number"
          step="0.01"
          @input="updateConversion"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          placeholder="Enter amount"
        />

        <select
          v-model="converterForm.fromCurrency"
          @change="updateConversion"
          class="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option
            v-for="pair in availablePairs"
            :key="`from-${pair.id}`"
            :value="pair.from_currency"
          >
            {{ pair.from_currency }}
          </option>
        </select>
      </div>


      <!-- Swap Button -->
      <div class="flex justify-center">
        <button
          @click="swapCurrencies"
          class="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-md transition-all transform hover:scale-110"
          title="Swap currencies"
        >
          <i class="fas fa-exchange-alt"></i>
        </button>
      </div>


      <!-- To Currency -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          To
        </label>

        <input
          :value="converterForm.toAmount"
          type="number"
          disabled
          class="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-semibold"
          placeholder="0.00"
        />

        <select
          v-model="converterForm.toCurrency"
          @change="updateConversion"
          class="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option
            v-for="pair in availablePairs"
            :key="`to-${pair.id}`"
            :value="pair.to_currency"
          >
            {{ pair.to_currency }}
          </option>
        </select>
      </div>
    </div>


    <!-- Conversion Rate -->
    <div
      v-if="converterRate"
      class="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200"
    >
      <p class="text-sm text-gray-700">
        <span class="font-semibold">
          1 {{ converterForm.fromCurrency }}
        </span>
        =
        <span class="font-semibold text-blue-600">
          {{ converterRate }}
          {{ converterForm.toCurrency }}
        </span>
      </p>
    </div>


    <!-- Proceed -->
    <button
      v-if="converterForm.fromAmount > 0"
      class="w-full mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
    >
      <i class="fas fa-paper-plane mr-2"></i>
      Proceed to Exchange
    </button>
  </div>


  <!-- ========================================= -->
  <!-- OTHER PROVIDERS -->
  <!-- ========================================= -->
  <div
    v-if="otherProviderGroups.length"
    class="grid grid-cols-1 md:grid-cols-2 gap-6"
  >
    <h1 class="text-md font-semibold text-gray-900">Other Apps Exchange Rates</h1>
    <div
      v-for="group in otherProviderGroups"
      :key="group.counterparty.id"
      class="rounded-xl overflow-hidden transition-all duration-300 bg-gray-100 border border-gray-200 opacity-60"
    >

      <!-- HEADER -->
      <div class="p-5 bg-gray-400 text-white">
        <div class="flex items-center gap-3">

          <div
            class="w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden bg-white"
          >
            <img
              v-if="group.counterparty.logo_url"
              :src="group.counterparty.logo_url"
              :alt="group.counterparty.name"
              class="w-full h-full object-contain p-1"
            />

            <span v-else class="text-gray-500 font-bold text-lg">
              {{ group.counterparty.name?.charAt(0) }}
            </span>
          </div>

          <div class="flex-1">
            <h3 class="text-xl font-bold">
              {{ group.counterparty.name }}
            </h3>
          </div>

        </div>
      </div>


      <!-- RATES -->
      <div class="p-6">
        <div class="space-y-3">

          <div
            v-for="rate in group.rates"
            :key="rate.id"
            class="flex items-center justify-between p-4 rounded-lg bg-white"
          >

            <!-- Currency Pair -->
            <div class="flex-1">
              <div class="font-semibold text-gray-500">
                {{ rate.currency_pair.from_currency }}

                <span class="mx-1 text-gray-400">
                  →
                </span>

                {{ rate.currency_pair.to_currency }}
              </div>

              <div class="text-xs mt-1 text-gray-400">
                {{ formatDirection(rate.direction) }}
              </div>
            </div>


            <!-- Rate -->
            <div class="text-right">
              <div class="text-2xl font-bold font-mono text-gray-500">
                {{ Number(rate.rate) }}
              </div>

              <div class="text-xs mt-1 text-gray-400">
                per 1 {{ rate.currency_pair.from_currency }}
              </div>
            </div>

          </div>

        </div>

        <div class="mt-6 text-center">
          <span class="text-xs text-gray-400">
            Rate comparison only
          </span>
        </div>

      </div>
    </div>
  </div>

</div>


<!-- No rates -->
<div
  v-else
  class="bg-white rounded-lg shadow p-8 text-center"
>
  <i class="fas fa-chart-line text-4xl text-gray-300 mb-3"></i>

  <p class="text-gray-600">
    No rates available for {{ formatDate(selectedDate) }}
  </p>
</div>

      <!-- Features Section -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-12">
        <div class="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition">
          <i class="fas fa-bolt text-red-600 text-3xl mb-3"></i>
          <h4 class="font-bold text-gray-900 mb-2">Fast Transfers</h4>
          <p class="text-sm text-gray-600">Money arrives in minutes</p>
        </div>

        <div class="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition">
          <i class="fas fa-shield-alt text-red-600 text-3xl mb-3"></i>
          <h4 class="font-bold text-gray-900 mb-2">Secure Transactions</h4>
          <p class="text-sm text-gray-600">Bank-level encryption</p>
        </div>

        <div class="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition">
          <i class="fas fa-percent text-red-600 text-3xl mb-3"></i>
          <h4 class="font-bold text-gray-900 mb-2">Competitive Rates</h4>
          <p class="text-sm text-gray-600">Best rates in the market</p>
        </div>

        <div class="bg-white rounded-lg p-6 text-center shadow-sm hover:shadow-md transition">
          <i class="fas fa-users text-red-600 text-3xl mb-3"></i>
          <h4 class="font-bold text-gray-900 mb-2">Trusted by Families</h4>
          <p class="text-sm text-gray-600">Millions send safely</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useExchangeRates } from '@/composables/Useexchangerate'

const {
  rates,
  ratesByCounterparty,
  loading,
  selectedDate,
  fetchRatesByDate,
  fetchCounterparties,
  fetchCurrencyPairs
} = useExchangeRates()

// =====================================================
// MAIN COUNTERPARTY
// =====================================================

const MAIN_COUNTERPARTY_NAME = 'Paratus'

// =====================================================
// DIRECTION
// =====================================================

const direction = ref<'NGN_TO_FOREIGN' | 'FOREIGN_TO_NGN'>('NGN_TO_FOREIGN')

// =====================================================
// CONVERTER
// =====================================================

const converterForm = ref({
  fromAmount: '',
  fromCurrency: 'NGN',
  toCurrency: 'GBP',
  toAmount: 0
})

const converterRate = ref<number | null>(null)

// =====================================================
// INITIALIZE
// =====================================================

onMounted(async () => {
  await fetchCounterparties()
  await fetchRatesByDate()

  updateConverterCurrencies()
})

// =====================================================
// GET AVAILABLE CURRENCY PAIRS
// =====================================================

const availablePairs = computed(() => {
  const pairs = rates.value
    .filter((rate) => {
      const from = rate.currency_pair?.from_currency
      const to = rate.currency_pair?.to_currency

      if (!from || !to) return false

      if (direction.value === 'NGN_TO_FOREIGN') {
        return from === 'NGN'
      }

      return from !== 'NGN'
    })
    .map((rate) => ({
      id: rate.currency_pair_id,
      from_currency: rate.currency_pair.from_currency,
      to_currency: rate.currency_pair.to_currency
    }))

  // Remove duplicates
  return pairs.filter((pair, index, self) => index === self.findIndex((p) => p.id === pair.id))
})

// =====================================================
// FILTER + SORT COUNTERPARTY CARDS
// =====================================================

const filteredRatesByCounterparty = computed(() => {
  return (
    ratesByCounterparty.value
      .map((group) => ({
        ...group,

        // Only show rates relevant to selected direction
        rates: group.rates.filter((rate) => {
          const fromCurrency = rate.currency_pair?.from_currency

          if (!fromCurrency) return false

          if (direction.value === 'NGN_TO_FOREIGN') {
            return fromCurrency === 'NGN'
          }

          return fromCurrency !== 'NGN'
        })
      }))

      // Remove counterparties with no rates
      .filter((group) => group.rates.length > 0)

      // Paratus MUST come first
      .sort((a, b) => {
        const aIsMain = a.counterparty?.name?.toLowerCase() === MAIN_COUNTERPARTY_NAME.toLowerCase()

        const bIsMain = b.counterparty?.name?.toLowerCase() === MAIN_COUNTERPARTY_NAME.toLowerCase()

        if (aIsMain && !bIsMain) return -1
        if (!aIsMain && bIsMain) return 1

        return 0
      })
  )
})

// =====================================================
// CHECK IF MAIN COUNTERPARTY
// =====================================================

const isMainCounterparty = (counterpartyId: string) => {
  const group = ratesByCounterparty.value.find((group) => group.counterparty?.id === counterpartyId)

  return group?.counterparty?.name?.toLowerCase() === MAIN_COUNTERPARTY_NAME.toLowerCase()
}

// =====================================================
// FORMAT DATE
// =====================================================

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// =====================================================
// FORMAT RATE DIRECTION
// =====================================================

const formatDirection = (rateDirection: string) => {
  const directionMap: Record<string, string> = {
    BUY: 'Buy rate',
    SELL: 'Sell rate',
    BOTH: 'Mid-market rate'
  }

  return directionMap[rateDirection] || rateDirection
}

// =====================================================
// SET DEFAULT CURRENCIES
// =====================================================

const updateConverterCurrencies = () => {
  if (direction.value === 'NGN_TO_FOREIGN') {
    converterForm.value.fromCurrency = 'NGN'

    // Find first available NGN → foreign pair
    const pair = availablePairs.value[0]

    converterForm.value.toCurrency = pair?.to_currency || 'GBP'
  } else {
    // Find first foreign → NGN pair
    const pair = availablePairs.value[0]

    converterForm.value.fromCurrency = pair?.from_currency || 'GBP'

    converterForm.value.toCurrency = 'NGN'
  }

  updateConversion()
}

// =====================================================
// CONVERT
// =====================================================
const sendMoneyWithParatus = (group: any) => {
  // Get the first displayed rate for Paratus
  const rate = group.rates?.[0]

  if (!rate) return

  const fromCurrency = rate.currency_pair?.from_currency
  const toCurrency = rate.currency_pair?.to_currency
  const exchangeRate = Number(rate.rate)

  const message = `Hello Paratus,

I would like to send money with Paratus.

Currency: ${fromCurrency} → ${toCurrency}
Exchange Rate: ${exchangeRate} ${toCurrency} per 1 ${fromCurrency}

Please assist me with the next steps.`

  const whatsappUrl = `https://wa.me/+2348025253804?text=${encodeURIComponent(message)}`

  window.open(whatsappUrl, '_blank')
}
const updateConversion = () => {
  const amount = Number(converterForm.value.fromAmount)

  if (!amount || amount <= 0) {
    converterForm.value.toAmount = 0
    converterRate.value = null
    return
  }

  const matchingRate = rates.value.find((rate) => {
    const pair = rate.currency_pair

    return (
      pair?.from_currency === converterForm.value.fromCurrency &&
      pair?.to_currency === converterForm.value.toCurrency
    )
  })

  if (matchingRate) {
    converterRate.value = Number(matchingRate.rate)

    converterForm.value.toAmount = Number((amount * Number(matchingRate.rate)))
  } else {
    converterRate.value = null
    converterForm.value.toAmount = 0
  }
}

// =====================================================
// SWAP
// =====================================================

const swapCurrencies = () => {
  const temp = converterForm.value.fromCurrency

  converterForm.value.fromCurrency = converterForm.value.toCurrency

  converterForm.value.toCurrency = temp

  updateConversion()
}

// =====================================================
// WATCH DIRECTION
// =====================================================

watch(
  () => direction.value,
  () => {
    updateConverterCurrencies()
  }
)

// =====================================================
// PARATUS GROUP
// =====================================================
const paratusGroup = computed(() => {
  return filteredRatesByCounterparty.value.find(
    (group) =>
      group.counterparty?.name?.toLowerCase() ===
      MAIN_COUNTERPARTY_NAME.toLowerCase()
  )
})

// =====================================================
// OTHER PROVIDERS
// =====================================================
const otherProviderGroups = computed(() => {
  return filteredRatesByCounterparty.value.filter(
    (group) =>
      group.counterparty?.name?.toLowerCase() !==
      MAIN_COUNTERPARTY_NAME.toLowerCase()
  )
})
</script>
