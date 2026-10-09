<script setup>
    import { ref, computed } from 'vue'
    const total = ref({
        Income: 8000,
        Expenses: 9000
    })
    const results = computed(() => {
      return total.value.Income - total.value.Expenses
    })
    const totals = computed(() => ({
      Income: total.value.Income,
      Expenses: total.value.Expenses,
      Results: results.value,
    }))

    const series = ref([
        {
            name: 'Income',
            data: [44, 55, 57, 56, 61, 58, 63, 60, 66, 63, 60, 66],
        },
        {
            name: 'Expenses',
            data: [76, 85, 101, 98, 87, 105, 91, 114, 94, 91, 114, 94],
        },
        {
            name: 'Results',
            data: [35, 41, 36, 26, 45, 48, 52, 53, 41, 52, 53, 41],
        },
    ])
    const chartOptions = ref({
        chart: {
            id: 'bar-chart',
            type: 'bar',
            height: 350,
            toolbar: {
                show: false // This hides the entire toolbar including the menu icon
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                dataLabels: {
                    position: 'top',
                },
                columnWidth: '55%',
                endingShape: 'rounded',
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent'],
        },
        xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        },
        yaxis: {
            title: {
                text: '$ (thousands)',
            },
        },
        fill: {
            opacity: 1,
        },
        tooltip: {
            y: {
                formatter(val) {
                    return '$ ' + val + ' thousands'
                },
            },
        },
        legend: {
            show: false
        }
    })
</script>
<template>
    <div class="col-md-12">
        <div class="card">
            <div class="card-header header-with-legend">
                <h4>Resultat i DKK</h4>

                <div class="custom-legend">
                    <div
                        v-for="(value, name) in totals"
                        :key="name"
                        class="legend-item"
                        @click="toggleSeries(name)"
                    >
                        <span class="label">{{ name }}: </span>
                        <span
                            class="value"
                            :class="{
                            green: value >= 0 && name !== 'Expenses',
                            red: value < 0 || name === 'Expenses'
                            }"
                        >
                            {{ value.toFixed(2) }}
                        </span>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <apexchart
                    type="bar"
                    height="350"
                    :options="chartOptions"
                    :series="series"
                />
            </div>
        </div>
    </div>
</template>
<style scoped>
.header-with-legend {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.custom-legend {
  display: flex;
  gap: 20px;
  font-weight: 600;
}

.legend-item {
  cursor: pointer;
  user-select: none;
}

.legend-item .label {
  /*color: #333;*/
}

.legend-item .value.green {
  color: green;
}

.legend-item .value.red {
  color: red;
}

</style>
