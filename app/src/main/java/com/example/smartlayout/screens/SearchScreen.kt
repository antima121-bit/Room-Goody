package com.example.smartlayout.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.smartlayout.data.dao.DetectedObjectDao
import com.example.smartlayout.data.entity.DetectedObjectEntity
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class SearchViewModel @Inject constructor(
    private val detectedObjectDao: DetectedObjectDao
) : ViewModel() {
    data class QueryState(
        val brand: String? = null,
        val category: String? = null,
        val color: String? = null,
        val shape: String? = null,
        val size: String? = null
    )

    private val queryState = MutableStateFlow(QueryState())

    val results: StateFlow<List<DetectedObjectEntity>> = queryState
        .flatMapLatest { q ->
            detectedObjectDao.multiFilter(
                brand = q.brand?.ifBlank { null },
                category = q.category?.ifBlank { null },
                color = q.color?.ifBlank { null },
                shape = q.shape?.ifBlank { null },
                size = q.size?.ifBlank { null }
            )
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun updateQuery(transform: (QueryState) -> QueryState) {
        queryState.value = transform(queryState.value)
    }
}

@Composable
fun SearchScreen() {
    val vm: SearchViewModel = hiltViewModel()
    val items by vm.results.collectAsState()

    val brand = remember { mutableStateOf("") }
    val category = remember { mutableStateOf("") }
    val color = remember { mutableStateOf("") }
    val shape = remember { mutableStateOf("") }
    val size = remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.Top) {
        OutlinedTextField(value = brand.value, onValueChange = {
            brand.value = it
            vm.updateQuery { s -> s.copy(brand = it) }
        }, label = { Text("brand") })
        OutlinedTextField(value = category.value, onValueChange = {
            category.value = it
            vm.updateQuery { s -> s.copy(category = it) }
        }, label = { Text("category") })
        OutlinedTextField(value = color.value, onValueChange = {
            color.value = it
            vm.updateQuery { s -> s.copy(color = it) }
        }, label = { Text("color") })
        OutlinedTextField(value = shape.value, onValueChange = {
            shape.value = it
            vm.updateQuery { s -> s.copy(shape = it) }
        }, label = { Text("shape") })
        OutlinedTextField(value = size.value, onValueChange = {
            size.value = it
            vm.updateQuery { s -> s.copy(size = it) }
        }, label = { Text("size") })

        Text(text = "Results: ${'$'}{items.size}")
        for (obj in items) {
            Text(text = "${'$'}{obj.brand ?: ""} ${'$'}{obj.category ?: ""} ${'$'}{obj.color ?: ""} ${'$'}{obj.shape ?: ""} ${'$'}{obj.size ?: ""}")
        }
    }
}