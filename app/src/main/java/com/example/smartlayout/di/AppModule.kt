package com.example.smartlayout.di

import android.content.Context
import androidx.room.Room
import com.example.smartlayout.data.AppDatabase
import com.example.smartlayout.data.dao.DetectedObjectDao
import com.example.smartlayout.data.dao.FurnitureMarkerDao
import com.example.smartlayout.data.dao.RoomDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(context, AppDatabase::class.java, "smartlayout.db")
            .fallbackToDestructiveMigration()
            .build()

    @Provides
    fun provideRoomDao(db: AppDatabase): RoomDao = db.roomDao()

    @Provides
    fun provideFurnitureMarkerDao(db: AppDatabase): FurnitureMarkerDao = db.furnitureMarkerDao()

    @Provides
    fun provideDetectedObjectDao(db: AppDatabase): DetectedObjectDao = db.detectedObjectDao()
}