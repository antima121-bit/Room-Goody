package com.example.smartlayout.services

import android.content.Context
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.storage.storage

object SupabaseClientProvider {
    @Volatile
    private var instance: SupabaseClient? = null

    fun get(context: Context): SupabaseClient {
        return instance ?: synchronized(this) {
            instance ?: createSupabaseClient(
                supabaseUrl = com.example.smartlayout.BuildConfig.SUPABASE_URL,
                supabaseKey = com.example.smartlayout.BuildConfig.SUPABASE_ANON_KEY
            ) {
                install(auth)
                install(postgrest)
                install(storage)
            }.also { instance = it }
        }
    }
}