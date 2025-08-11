package com.example.smartlayout.data

import androidx.room.Database
import androidx.room.RoomDatabase
import com.example.smartlayout.data.dao.DetectedObjectDao
import com.example.smartlayout.data.dao.FurnitureMarkerDao
import com.example.smartlayout.data.dao.RoomDao
import com.example.smartlayout.data.entity.DetectedObjectEntity
import com.example.smartlayout.data.entity.FurnitureMarkerEntity
import com.example.smartlayout.data.entity.RoomEntity

@Database(
    entities = [RoomEntity::class, FurnitureMarkerEntity::class, DetectedObjectEntity::class],
    version = 1,
    exportSchema = true
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun roomDao(): RoomDao
    abstract fun furnitureMarkerDao(): FurnitureMarkerDao
    abstract fun detectedObjectDao(): DetectedObjectDao
}