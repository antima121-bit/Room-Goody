package com.example.smartlayout.data.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update
import com.example.smartlayout.data.entity.DetectedObjectEntity
import com.example.smartlayout.data.entity.FurnitureMarkerEntity
import com.example.smartlayout.data.entity.RoomEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface RoomDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(room: RoomEntity): Long

    @Update
    suspend fun update(room: RoomEntity)

    @Delete
    suspend fun delete(room: RoomEntity)

    @Query("SELECT * FROM rooms ORDER BY createdAtEpochMs DESC")
    fun getAll(): Flow<List<RoomEntity>>

    @Query("SELECT * FROM rooms WHERE id = :id")
    suspend fun getById(id: Long): RoomEntity?
}

@Dao
interface FurnitureMarkerDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(marker: FurnitureMarkerEntity): Long

    @Query("SELECT * FROM furniture_markers WHERE roomId = :roomId")
    fun markersForRoom(roomId: Long): Flow<List<FurnitureMarkerEntity>>

    @Delete
    suspend fun delete(marker: FurnitureMarkerEntity)
}

@Dao
interface DetectedObjectDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(obj: DetectedObjectEntity): Long

    @Query("SELECT * FROM detected_objects ORDER BY id DESC")
    fun getAll(): Flow<List<DetectedObjectEntity>>

    @Query(
        "SELECT * FROM detected_objects WHERE (:brand IS NULL OR brand = :brand) AND (:category IS NULL OR category = :category) AND (:color IS NULL OR color = :color) AND (:shape IS NULL OR shape = :shape) AND (:size IS NULL OR size = :size)"
    )
    fun multiFilter(
        brand: String?,
        category: String?,
        color: String?,
        shape: String?,
        size: String?
    ): Flow<List<DetectedObjectEntity>>
}