<template>
  <div class="exchange-rate-container">
    <!-- Header with Date Picker -->
    <div class="exchange-rate-header">
      <div>
        <h1 class="text-h4 font-weight-bold">Exchange Rates</h1>
        <p class="text-subtitle2 text-medium-emphasis">
          Compare and send money with the best rates
        </p>
      </div>

      <!-- Compact Date Picker (Top Right) -->
      <div class="date-picker-compact">
        <v-card flat border>
          <v-card-text class="pa-2">
            <div class="d-flex align-center gap-6">
              <span class="text-caption font-weight-bold">Date:</span>
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    :text="formatDate(selectedDate)"
                    size="small"
                    variant="outlined"
                    color="#DC2626"
                  ></v-btn>
                </template>
                <v-date-picker
                  color="red"
                  v-model="selectedDate"
                  @update:model-value="fetchRatesByDate"
                ></v-date-picker>
              </v-menu>
              <v-btn
                size="x-small"
                variant="tonal"
                color="#DC2626"
                @click="setToday"
                class="text-lowercase"
              >
                today
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Tabs -->
    <v-tabs v-model="activeTab" bg-color="surface" class="mb-6">
      <v-tab value="rates" color="#DC2626">
        <v-icon start>mdi-trending-up</v-icon>
        Exchange Rates
      </v-tab>
      <v-tab value="counterparties" color="#DC2626">
        <v-icon start>mdi-bank</v-icon>
        Counterparties
      </v-tab>
      <v-tab value="pairs" color="#DC2626">
        <v-icon start>mdi-currency-usd-gbp</v-icon>
        Currency Pairs
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab" class="mt-4">
      <!-- Rates Tab -->
      <v-window-item value="rates">
        <div class="mb-6">
          <v-btn
            prepend-icon="mdi-plus"
            color="#DC2626"
            @click="openRateForm"
            class="text-lowercase"
          >
            New exchange rate
          </v-btn>
        </div>

        <!-- Rates Grid -->
        <div v-if="loading" class="text-center py-12">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <v-empty-state
          v-else-if="!filteredRates.length"
          icon="mdi-file-document-outline"
          title="No Exchange Rates"
          text="No rates found for the selected date"
        ></v-empty-state>

        <v-row v-else>
          <v-col v-for="rate in filteredRates" :key="rate.id" cols="12" sm="6" md="4">
            <v-card
              class="rate-card h-100 cursor-pointer"
              :class="{ active: selectedRateId === rate.id }"
              @click="selectRate(rate)"
              hover
            >
              <v-card-item>
                <div class="d-flex justify-space-between align-start">
                  <div class="d-flex align-center gap-3 flex-grow-1">
                    <v-avatar
                      v-if="rate.counterparty?.logo_url"
                      :image="rate.counterparty.logo_url"
                      size="36"
                    ></v-avatar>
                    <v-icon v-else size="36" class="text-medium-emphasis">
                      mdi-bank-outline
                    </v-icon>
                    <div>
                      <div class="text-subtitle2 font-weight-bold">
                        {{ rate.counterparty?.name }}
                      </div>
                      <div class="text-caption text-medium-emphasis">
                        {{ rate.currency_pair?.from_currency }} →
                        {{ rate.currency_pair?.to_currency }}
                      </div>
                    </div>
                  </div>
                </div>
              </v-card-item>

              <v-card-text>
                <div class="rate-value mb-3">
                  <span class="text-h5 font-weight-bold">{{ rate.rate.toFixed(2) }}</span>
                </div>
                <v-chip :color="directionColor(rate.direction)" size="small" label class="mb-2">
                  {{ rate.direction }}
                </v-chip>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <span class="text-caption text-medium-emphasis">
                  {{ formatDate(rate.rate_date) }}
                </span>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Counterparties Tab -->
      <v-window-item value="counterparties">
        <div class="mb-6">
          <v-btn
            prepend-icon="mdi-plus"
            color="#DC2626"
            @click="openCounterpartyForm"
            class="text-lowercase"
          >
            New counterparty
          </v-btn>
        </div>

        <div v-if="loading" class="text-center py-12">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <v-empty-state
          v-else-if="!counterparties.length"
          icon="mdi-bank-outline"
          title="No Counterparties"
          text="Create your first counterparty to get started"
        ></v-empty-state>

        <v-row v-else>
          <v-col v-for="cp in counterparties" :key="cp.id" cols="12" sm="6" md="4">
            <v-card
              class="counterparty-card h-100 cursor-pointer"
              :class="{ active: selectedCounterpartyId === cp.id }"
              @click="selectCounterparty(cp)"
              hover
            >
              <v-card-item>
                <div class="d-flex justify-space-between align-start">
                  <div class="flex-grow-1">
                    <v-avatar
                      v-if="cp.logo_url"
                      :image="cp.logo_url"
                      size="40"
                      class="mb-2"
                    ></v-avatar>
                    <div class="text-subtitle2 font-weight-bold">{{ cp.name }}</div>
                  </div>
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon="mdi-dots-vertical"
                        size="small"
                        variant="text"
                        @click.stop
                      ></v-btn>
                    </template>
                    <v-list>
                      <v-list-item
                        prepend-icon="mdi-pencil"
                        title="Edit"
                        @click="editCounterparty(cp)"
                      ></v-list-item>
                      <v-list-item
                        prepend-icon="mdi-delete"
                        title="Delete"
                        @click="confirmDeleteCounterparty(cp)"
                      ></v-list-item>
                    </v-list>
                  </v-menu>
                </div>
              </v-card-item>

              <v-card-text>
                <p class="text-caption text-medium-emphasis mb-3">
                  {{ cp.description || 'No description' }}
                </p>
                <div class="d-flex align-center gap-2">
                  <v-chip
                    :color="cp.is_active ? 'success' : 'error'"
                    :prepend-icon="cp.is_active ? 'mdi-check' : 'mdi-close'"
                    :text="cp.is_active ? 'Active' : 'Inactive'"
                    size="small"
                  ></v-chip>
                  <v-chip
                    prepend-icon="mdi-chart-line"
                    :text="`Priority: ${cp.priority}`"
                    size="small"
                    variant="outlined"
                  ></v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Currency Pairs Tab -->
      <v-window-item value="pairs">
        <div class="mb-6">
          <v-btn
            prepend-icon="mdi-plus"
            color="#DC2626"
            @click="openPairForm"
            class="text-lowercase"
          >
            New currency pair
          </v-btn>
        </div>

        <div v-if="loading" class="text-center py-12">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <v-empty-state
          v-else-if="!currencyPairs.length"
          icon="mdi-currency-usd-gbp"
          title="No Currency Pairs"
          text="Create your first currency pair to get started"
        ></v-empty-state>

        <v-row v-else>
          <v-col v-for="pair in currencyPairs" :key="pair.id" cols="12" sm="6" md="4">
            <v-card
              class="pair-card h-100 cursor-pointer"
              :class="{ active: selectedPairId === pair.id }"
              @click="selectPair(pair)"
              hover
            >
              <v-card-item>
                <div class="d-flex justify-space-between align-center">
                  <div class="flex-grow-1">
                    <div class="pair-display">
                      <span class="currency-code">{{ pair.from_currency }}</span>
                      <v-icon size="24">mdi-arrow-right</v-icon>
                      <span class="currency-code">{{ pair.to_currency }}</span>
                    </div>
                  </div>
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn
                        v-bind="props"
                        icon="mdi-dots-vertical"
                        size="small"
                        variant="text"
                        @click.stop
                      ></v-btn>
                    </template>
                    <v-list>
                      <v-list-item
                        prepend-icon="mdi-pencil"
                        title="Edit"
                        @click="editPair(pair)"
                      ></v-list-item>
                      <v-list-item
                        prepend-icon="mdi-delete"
                        title="Delete"
                        @click="confirmDeletePair(pair)"
                      ></v-list-item>
                    </v-list>
                  </v-menu>
                </div>
              </v-card-item>

              <v-card-text>
                <v-chip
                  :color="pair.is_active ? 'success' : 'error'"
                  :prepend-icon="pair.is_active ? 'mdi-check' : 'mdi-close'"
                  :text="pair.is_active ? 'Active' : 'Inactive'"
                  size="small"
                ></v-chip>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>

    <!-- Rate Detail Dialog -->
    <v-dialog v-model="showRateDetail" max-width="500">
      <v-card v-if="selectedRate">
        <v-card-item>
          <template v-slot:prepend>
            <v-btn icon="mdi-close" variant="text" @click="showRateDetail = false"></v-btn>
          </template>
          <v-card-title>{{ selectedRate.counterparty?.name }}</v-card-title>
        </v-card-item>

        <v-divider></v-divider>

        <v-card-text class="pa-6">
          <!-- Information Section -->
          <div class="mb-6">
            <h3 class="text-subtitle1 font-weight-bold mb-4">Information</h3>
            <v-row>
              <v-col cols="12">
                <div class="info-row">
                  <span class="label">Counterparty</span>
                  <span class="value">{{ selectedRate.counterparty?.name }}</span>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="info-row">
                  <span class="label">Currency Pair</span>
                  <span class="value">
                    {{ selectedRate.currency_pair?.from_currency }} →
                    {{ selectedRate.currency_pair?.to_currency }}
                  </span>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="info-row">
                  <span class="label">Rate</span>
                  <span class="value font-weight-bold text-h6">
                    {{ selectedRate.rate.toFixed(2) }}
                  </span>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="info-row">
                  <span class="label">Direction</span>
                  <v-chip :color="directionColor(selectedRate.direction)" size="small">
                    {{ selectedRate.direction }}
                  </v-chip>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="info-row">
                  <span class="label">Date</span>
                  <span class="value">{{ formatDate(selectedRate.rate_date) }}</span>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- Actions -->
          <v-row class="mt-8">
            <v-col cols="12">
              <v-btn
                block
                prepend-icon="mdi-pencil"
                variant="tonal"
                @click="editRate(selectedRate)"
              >
                edit rate
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-btn
                block
                prepend-icon="mdi-delete"
                color="error"
                variant="tonal"
                @click="confirmDeleteRate(selectedRate)"
              >
                delete rate
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Counterparty Detail Dialog -->
    <v-dialog v-model="showCounterpartyDetail" max-width="500">
      <v-card v-if="selectedCounterparty">
        <v-card-item>
          <template v-slot:prepend>
            <v-btn icon="mdi-close" variant="text" @click="showCounterpartyDetail = false"></v-btn>
          </template>
          <v-card-title>{{ selectedCounterparty.name }}</v-card-title>
        </v-card-item>

        <v-divider></v-divider>

        <v-card-text class="pa-6">
          <!-- Logo -->
          <div class="mb-6 text-center">
            <v-avatar
              v-if="selectedCounterparty.logo_url"
              :image="selectedCounterparty.logo_url"
              size="80"
            ></v-avatar>
            <v-icon v-else size="80" class="text-medium-emphasis"> mdi-bank-outline </v-icon>
          </div>

          <!-- Information Section -->
          <div class="mb-6">
            <h3 class="text-subtitle1 font-weight-bold mb-4">Information</h3>
            <v-row>
              <v-col cols="12">
                <div class="info-row">
                  <span class="label">Name</span>
                  <span class="value">{{ selectedCounterparty.name }}</span>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="info-row">
                  <span class="label">Description</span>
                  <span class="value">{{ selectedCounterparty.description || 'N/A' }}</span>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="info-row">
                  <span class="label">Priority</span>
                  <span class="value">{{ selectedCounterparty.priority }}</span>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="info-row">
                  <span class="label">Status</span>
                  <v-chip
                    :color="selectedCounterparty.is_active ? 'success' : 'error'"
                    :prepend-icon="selectedCounterparty.is_active ? 'mdi-check' : 'mdi-close'"
                  >
                    {{ selectedCounterparty.is_active ? 'Active' : 'Inactive' }}
                  </v-chip>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="info-row">
                  <span class="label">Created</span>
                  <span class="value">{{ formatDate(selectedCounterparty.created_at) }}</span>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- Actions -->
          <v-row class="mt-8">
            <v-col cols="12">
              <v-btn
                block
                prepend-icon="mdi-pencil"
                variant="tonal"
                @click="editCounterparty(selectedCounterparty)"
              >
                edit counterparty
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-btn
                block
                :prepend-icon="selectedCounterparty.is_active ? 'mdi-pause' : 'mdi-play'"
                variant="tonal"
                @click="
                  toggleCounterpartyActive(selectedCounterparty.id, !selectedCounterparty.is_active)
                "
              >
                {{ selectedCounterparty.is_active ? 'deactivate' : 'activate' }}
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-btn
                block
                prepend-icon="mdi-delete"
                color="error"
                variant="tonal"
                @click="confirmDeleteCounterparty(selectedCounterparty)"
              >
                delete counterparty
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Currency Pair Detail Dialog -->
    <v-dialog v-model="showPairDetail" max-width="500">
      <v-card v-if="selectedPair">
        <v-card-item>
          <template v-slot:prepend>
            <v-btn icon="mdi-close" variant="text" @click="showPairDetail = false"></v-btn>
          </template>
          <v-card-title>
            {{ selectedPair.from_currency }} → {{ selectedPair.to_currency }}
          </v-card-title>
        </v-card-item>

        <v-divider></v-divider>

        <v-card-text class="pa-6">
          <!-- Information Section -->
          <div class="mb-6">
            <h3 class="text-subtitle1 font-weight-bold mb-4">Information</h3>
            <v-row>
              <v-col cols="12">
                <div class="info-row">
                  <span class="label">From Currency</span>
                  <span class="value font-weight-bold">{{ selectedPair.from_currency }}</span>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="info-row">
                  <span class="label">To Currency</span>
                  <span class="value font-weight-bold">{{ selectedPair.to_currency }}</span>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="info-row">
                  <span class="label">Status</span>
                  <v-chip
                    :color="selectedPair.is_active ? 'success' : 'error'"
                    :prepend-icon="selectedPair.is_active ? 'mdi-check' : 'mdi-close'"
                  >
                    {{ selectedPair.is_active ? 'Active' : 'Inactive' }}
                  </v-chip>
                </div>
              </v-col>
              <v-col cols="12">
                <div class="info-row">
                  <span class="label">Created</span>
                  <span class="value">{{ formatDate(selectedPair.created_at) }}</span>
                </div>
              </v-col>
            </v-row>
          </div>

          <!-- Actions -->
          <v-row class="mt-8">
            <v-col cols="12">
              <v-btn
                block
                prepend-icon="mdi-pencil"
                variant="tonal"
                @click="editPair(selectedPair)"
              >
                edit pair
              </v-btn>
            </v-col>
            <v-col cols="12">
              <v-btn
                block
                prepend-icon="mdi-delete"
                color="error"
                variant="tonal"
                @click="confirmDeletePair(selectedPair)"
              >
                delete pair
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Rate Form Dialog -->
    <v-dialog v-model="showRateFormDialog" max-width="600">
      <v-card>
        <v-card-item>
          <v-card-title>{{
            editingRateId ? 'Edit Exchange Rate' : 'Create New Exchange Rate'
          }}</v-card-title>
          <template v-slot:append>
            <v-btn icon="mdi-close" variant="text" @click="closeRateForm"></v-btn>
          </template>
        </v-card-item>

        <v-divider></v-divider>

        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12">
              <v-select
                v-model="rateForm.counterparty_id"
                :items="counterparties"
                item-title="name"
                item-value="id"
                label="Counterparty *"
                variant="outlined"
              ></v-select>
            </v-col>

            <v-col cols="12">
              <v-select
                v-model="rateForm.currency_pair_id"
                :items="currencyPairs"
                :item-title="(item) => `${item.from_currency} → ${item.to_currency}`"
                item-value="id"
                label="Currency Pair *"
                variant="outlined"
              ></v-select>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
  v-model.number="rateForm.rate"
  label="Rate *"
  type="number"
  step="0.01"
  min="0"
  variant="outlined"
></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-select
                v-model="rateForm.direction"
                :items="['BUY', 'SELL']"
                label="Direction"
                variant="outlined"
              ></v-select>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeRateForm" class="text-lowercase"> cancel </v-btn>
          <v-btn
            color="#DC2626"
            variant="flat"
            :disabled="!rateForm.counterparty_id || !rateForm.currency_pair_id || !rateForm.rate"
            @click="saveRate"
            class="text-lowercase"
          >
            {{ editingRateId ? 'update' : 'create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Counterparty Form Dialog -->
    <v-dialog v-model="showCounterpartyFormDialog" max-width="600">
      <v-card>
        <v-card-item>
          <v-card-title>{{
            editingCounterpartyId ? 'edit counterparty' : 'Create New Counterparty'
          }}</v-card-title>
          <template v-slot:append>
            <v-btn icon="mdi-close" variant="text" @click="closeCounterpartyForm"></v-btn>
          </template>
        </v-card-item>

        <v-divider></v-divider>

        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="counterpartyForm.name"
                label="Name *"
                variant="outlined"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <div class="d-flex align-center gap-4 mb-2">
                <v-avatar v-if="logoPreview" :image="logoPreview" size="64"></v-avatar>
                <v-icon v-else size="64" class="text-medium-emphasis">mdi-bank-outline</v-icon>
                <v-file-input
                  v-model="logoFile"
                  label="Logo"
                  accept="image/*"
                  prepend-icon="mdi-camera"
                  variant="outlined"
                  density="compact"
                  @update:model-value="handleLogoChange"
                  hide-details
                ></v-file-input>
              </div>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="counterpartyForm.description"
                label="Description"
                rows="3"
                variant="outlined"
              ></v-textarea>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model.number="counterpartyForm.priority"
                label="Priority"
                type="number"
                variant="outlined"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeCounterpartyForm" class="text-lowercase">
            cancel
          </v-btn>
          <v-btn
            color="#DC2626"
            variant="flat"
            :disabled="!counterpartyForm.name"
            @click="saveCounterparty"
            class="text-lowercase"
          >
            {{ editingCounterpartyId ? 'update' : 'create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Currency Pair Form Dialog -->
    <v-dialog v-model="showPairFormDialog" max-width="600">
      <v-card>
        <v-card-item>
          <v-card-title>{{
            editingPairId ? 'Edit Currency Pair' : 'Create New Currency Pair'
          }}</v-card-title>
          <template v-slot:append>
            <v-btn icon="mdi-close" variant="text" @click="closePairForm"></v-btn>
          </template>
        </v-card-item>

        <v-divider></v-divider>

        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="pairForm.from_currency"
                label="From Currency *"
                maxlength="10"
                counter
                variant="outlined"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="pairForm.to_currency"
                label="To Currency *"
                maxlength="10"
                counter
                variant="outlined"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closePairForm" class="text-lowercase"> cancel </v-btn>
          <v-btn
            color="#DC2626"
            variant="flat"
            :disabled="!pairForm.from_currency || !pairForm.to_currency"
            @click="savePair"
            class="text-lowercase"
          >
            {{ editingPairId ? 'update' : 'create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteConfirm" max-width="400">
      <v-card>
        <v-card-item>
          <template v-slot:prepend>
            <v-icon color="error" size="large">mdi-alert-circle</v-icon>
          </template>
          <v-card-title>Delete {{ deleteItem.type }}?</v-card-title>
        </v-card-item>

        <v-card-text class="pa-6">
          <p class="mb-2">{{ deleteItem.name }}</p>
          <p class="text-error text-caption">This action cannot be undone.</p>
        </v-card-text>

        <v-card-actions class="pa-6">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteConfirm = false" :disabled="deleteLoading">
            Cancel
          </v-btn>
          <v-btn color="error" variant="flat" :loading="deleteLoading" @click="performDelete">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useExchangeRates } from '@/composables/Useexchangerate.ts'

const {
  rates,
  counterparties,
  currencyPairs,
  loading,
  selectedDate,
  fetchRatesByDate,
  fetchCounterparties,
  fetchCurrencyPairs,
  createRate,
  updateRate,
  deleteRate,
  createCounterparty,
  updateCounterparty,
  deleteCounterparty,
  createCurrencyPair,
  deleteCurrencyPair,
  uploadCounterpartyLogo
} = useExchangeRates()

// UI State
const activeTab = ref('rates')

// Rate State
const showRateDetail = ref(false)
const showRateFormDialog = ref(false)
const selectedRateId = ref<string | null>(null)
const editingRateId = ref<string | null>(null)
const rateForm = ref({
  counterparty_id: '',
  currency_pair_id: '',
  rate: null as number | null,
  direction: ''
})

// Counterparty State
const showCounterpartyDetail = ref(false)
const showCounterpartyFormDialog = ref(false)
const selectedCounterpartyId = ref<string | null>(null)
const editingCounterpartyId = ref<string | null>(null)
const counterpartyForm = ref({
  name: '',
  logo_url: '',
  description: '',
  priority: 1
})

// Pair State
const showPairDetail = ref(false)
const showPairFormDialog = ref(false)
const selectedPairId = ref<string | null>(null)
const editingPairId = ref<string | null>(null)
const pairForm = ref({
  from_currency: '',
  to_currency: ''
})

// Delete State
const showDeleteConfirm = ref(false)
const deleteItem = ref({ type: '', id: '', name: '' })
const deleteLoading = ref(false)

// Computed
const selectedRate = computed(() => {
  return rates.value.find((r) => r.id === selectedRateId.value) || null
})

const selectedCounterparty = computed(() => {
  return counterparties.value.find((c) => c.id === selectedCounterpartyId.value) || null
})

const selectedPair = computed(() => {
  return currencyPairs.value.find((p) => p.id === selectedPairId.value) || null
})

const filteredRates = computed(() => {
  return rates.value.filter((rate) => rate.rate_date === selectedDate.value)
})

// Methods
const setToday = () => {
  const today = new Date()
  selectedDate.value = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-')
  fetchRatesByDate()
}

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const directionColor = (direction: string): string => {
  switch (direction) {
    case 'BUY':
      return 'success'
    case 'SELL':
      return 'error'
    case 'BOTH':
      return 'info'
    default:
      return 'default'
  }
}

// Rate Methods
const openRateForm = () => {
  editingRateId.value = null
  rateForm.value = {
    counterparty_id: '',
    currency_pair_id: '',
    rate: null,
    direction: ''
  }
  showRateFormDialog.value = true
}

const editRate = (rate: any) => {
  editingRateId.value = rate.id
  rateForm.value = {
    counterparty_id: rate.counterparty_id,
    currency_pair_id: rate.currency_pair_id,
    rate: rate.rate,
    direction: rate.direction
  }
  showRateFormDialog.value = true
  showRateDetail.value = false
}

const closeRateForm = () => {
  showRateFormDialog.value = false
  editingRateId.value = null
}

const saveRate = async () => {
  try {
    if (rateForm.value.rate === null || rateForm.value.rate === undefined) {
      return
    }

    const payload = {
      counterparty_id: rateForm.value.counterparty_id,
      currency_pair_id: rateForm.value.currency_pair_id,
      rate: Number(rateForm.value.rate),
      direction: rateForm.value.direction,
      rate_date: selectedDate.value
    }

    if (editingRateId.value) {
      await updateRate(editingRateId.value, payload)
    } else {
      await createRate(payload)
    }

    await fetchRatesByDate()
    closeRateForm()
  } catch (err) {
    console.error('Error saving rate:', err)
  }
}

const selectRate = (rate: any) => {
  selectedRateId.value = rate.id
  showRateDetail.value = true
}

const confirmDeleteRate = (rate: any) => {
  deleteItem.value = {
    type: 'Exchange Rate',
    id: rate.id,
    name: `${rate.counterparty?.name} - ${rate.currency_pair?.from_currency}/${rate.currency_pair?.to_currency}`
  }
  showDeleteConfirm.value = true
  showRateDetail.value = false
}
const logoFile = ref<File | null>(null)
const logoPreview = ref<string | null>(null)

const handleLogoChange = (file: File | File[] | null) => {
  const f = Array.isArray(file) ? file[0] : file
  if (f) {
    logoPreview.value = URL.createObjectURL(f)
  } else {
    logoPreview.value = null
  }
}
// Counterparty Methods
const openCounterpartyForm = () => {
  editingCounterpartyId.value = null
  counterpartyForm.value = { name: '', logo_url: '', description: '', priority: 1 }
  logoFile.value = null
  logoPreview.value = null
  showCounterpartyFormDialog.value = true
}

const editCounterparty = (cp: any) => {
  editingCounterpartyId.value = cp.id
  counterpartyForm.value = {
    name: cp.name,
    logo_url: cp.logo_url || '',
    description: cp.description || '',
    priority: cp.priority
  }
  logoFile.value = null
  logoPreview.value = cp.logo_url || null
  showCounterpartyFormDialog.value = true
  showCounterpartyDetail.value = false
}

const closeCounterpartyForm = () => {
  showCounterpartyFormDialog.value = false
  editingCounterpartyId.value = null
  logoFile.value = null
  logoPreview.value = null
}

const saveCounterparty = async () => {
  try {
    let logoUrl = counterpartyForm.value.logo_url

    if (logoFile.value) {
      logoUrl = await uploadCounterpartyLogo(logoFile.value, editingCounterpartyId.value)
    }

    const payload = { ...counterpartyForm.value, logo_url: logoUrl }

    if (editingCounterpartyId.value) {
      await updateCounterparty(editingCounterpartyId.value, payload)
    } else {
      await createCounterparty(payload)
    }
    await fetchCounterparties()
    closeCounterpartyForm()
  } catch (err) {
    console.error('Error saving counterparty:', err)
  }
}

const selectCounterparty = (cp: any) => {
  selectedCounterpartyId.value = cp.id
  showCounterpartyDetail.value = true
}

const confirmDeleteCounterparty = (cp: any) => {
  deleteItem.value = {
    type: 'Counterparty',
    id: cp.id,
    name: cp.name
  }
  showDeleteConfirm.value = true
  showCounterpartyDetail.value = false
}

const toggleCounterpartyActive = async (id: string, isActive: boolean) => {
  try {
    await updateCounterparty(id, { is_active: isActive })
    await fetchCounterparties()
    if (selectedCounterpartyId.value === id) {
      selectedCounterpartyId.value = null
      showCounterpartyDetail.value = false
    }
  } catch (err) {
    console.error('Error toggling counterparty:', err)
  }
}

// Pair Methods
const openPairForm = () => {
  editingPairId.value = null
  pairForm.value = {
    from_currency: '',
    to_currency: ''
  }
  showPairFormDialog.value = true
}

const editPair = (pair: any) => {
  editingPairId.value = pair.id
  pairForm.value = {
    from_currency: pair.from_currency,
    to_currency: pair.to_currency
  }
  showPairFormDialog.value = true
  showPairDetail.value = false
}

const closePairForm = () => {
  showPairFormDialog.value = false
  editingPairId.value = null
}

const savePair = async () => {
  try {
    await createCurrencyPair(
      pairForm.value.from_currency.toUpperCase(),
      pairForm.value.to_currency.toUpperCase()
    )
    await fetchCurrencyPairs()
    closePairForm()
  } catch (err) {
    console.error('Error saving pair:', err)
  }
}

const selectPair = (pair: any) => {
  selectedPairId.value = pair.id
  showPairDetail.value = true
}

const confirmDeletePair = (pair: any) => {
  deleteItem.value = {
    type: 'Currency Pair',
    id: pair.id,
    name: `${pair.from_currency} → ${pair.to_currency}`
  }
  showDeleteConfirm.value = true
  showPairDetail.value = false
}

// Delete
const performDelete = async () => {
  deleteLoading.value = true
  try {
    if (deleteItem.value.type === 'Exchange Rate') {
      await deleteRate(deleteItem.value.id)
    } else if (deleteItem.value.type === 'Counterparty') {
      await deleteCounterparty(deleteItem.value.id)
    } else if (deleteItem.value.type === 'Currency Pair') {
      await deleteCurrencyPair(deleteItem.value.id)
    }

    showDeleteConfirm.value = false
  } catch (err) {
    console.error('Error deleting item:', err)
    alert(`Error deleting ${deleteItem.value.type}: ${err.message}`)
  } finally {
    deleteLoading.value = false
  }
}

// Lifecycle
onMounted(async () => {
  const today = new Date()
  selectedDate.value = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0')
  ].join('-')

  await Promise.all([fetchCounterparties(), fetchCurrencyPairs(), fetchRatesByDate()])
})
</script>

<style scoped lang="scss">
.exchange-rate-container {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.exchange-rate-header {
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
  flex-wrap: wrap;

  h1 {
    margin-bottom: 0.5rem;
  }
}

.date-picker-compact {
  flex-shrink: 0;
  min-width: 300px;

  .v-card {
    box-shadow: none;
    border: 1px solid rgba(0, 0, 0, 0.12);
  }
}

.rate-card,
.counterparty-card,
.pair-card {
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;

  &:hover {
    border-color: rgb(var(--v-theme-primary));
    transform: translateY(-2px);
  }

  &.active {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.05);
  }
}

.rate-value {
  font-family: 'Courier New', monospace;
}

.pair-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;

  .currency-code {
    font-family: 'Courier New', monospace;
    padding: 0.5rem 1rem;
    background-color: rgba(var(--v-theme-primary), 0.1);
    border-radius: 4px;
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);

  &:last-child {
    border-bottom: none;
  }

  .label {
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    color: rgba(0, 0, 0, 0.6);
    letter-spacing: 0.05em;
    min-width: 100px;
  }

  .value {
    font-size: 0.875rem;
    color: rgba(0, 0, 0, 0.87);
  }
}

:deep(.v-btn) {
  text-transform: none;
}
</style>
