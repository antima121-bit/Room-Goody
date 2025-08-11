package com.example.smartlayout.data.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

@Entity(tableName = "rooms")
data class RoomEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val layoutUri: String,
    val createdAtEpochMs: Long
)

@Entity(
    tableName = "furniture_markers",
    foreignKeys = [
        ForeignKey(
            entity = RoomEntity::class,
            parentColumns = ["id"],
            childColumns = ["roomId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("roomId")]
)
data class FurnitureMarkerEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val roomId: Long,
    val name: String,
    val x: Float,
    val y: Float
)

@Entity(tableName = "detected_objects")
data class DetectedObjectEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val externalId: String,
    val text: String?,
    val brand: String?,
    val category: String?,
    val color: String?,
    val shape: String?,
    val size: String?,
    val latitude: Double?,
    val longitude: Double?,
    val timestampIso: String,
    val imageUri: String?
)