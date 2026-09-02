import { Request, Response, NextFunction } from 'express'
import {
  createClassroomSession,
  joinClassroomSession,
  addWhiteboardStroke,
  addStudentDoubt,
  clusterLiveDoubts,
  launchLivePulseCheck,
  recordPulseResponse,
  getClassroomSessionById,
} from '../services/liveClassroomService'
import { AuthenticatedRequest } from '../middleware/auth'

// 1. POST /api/classroom/create — Host new live classroom session
export async function handleCreateClassroom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const teacherId = req.user?.userId || 'teacher-demo'
    const teacherName = (req.user as any)?.name || 'Demo Teacher'
    const { title, classLevel, subjectName, chapterId } = req.body

    const session = createClassroomSession({
      title: title || 'Live Interactive State Board Lesson',
      teacherId,
      teacherName,
      classLevel,
      subjectName,
      chapterId,
    })

    res.status(201).json({
      success: true,
      data: session,
      message: 'Live classroom room created successfully.',
    })
  } catch (err) {
    next(err)
  }
}

// 2. POST /api/classroom/join — Student join live room with room code
export async function handleJoinClassroom(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const studentId = req.user?.userId || 'student-demo'
    const studentName = (req.user as any)?.name || 'Student Demo'
    const { roomCode } = req.body

    if (!roomCode) {
      return res.status(400).json({ success: false, error: 'roomCode is required.' })
    }

    const session = joinClassroomSession({
      roomCode,
      studentId,
      studentName,
    })

    res.json({
      success: true,
      data: session,
      message: `Joined live room ${session.roomCode} successfully.`,
    })
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message || 'Room not found.' })
  }
}

// 3. POST /api/classroom/draw — Broadcast whiteboard drawing stroke
export async function handleAddStroke(req: Request, res: Response, next: NextFunction) {
  try {
    const { roomId, color, width, points, tool } = req.body

    if (!roomId || !points) {
      return res.status(400).json({ success: false, error: 'roomId and points are required.' })
    }

    const stroke = addWhiteboardStroke(roomId, {
      color: color || '#2563eb',
      width: width || 3,
      points,
      tool: tool || 'pen',
    })

    res.status(201).json({
      success: true,
      data: stroke,
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// 4. POST /api/classroom/doubt — Post student question in live room
export async function handlePostDoubt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const studentId = req.user?.userId || 'student-demo'
    const studentName = (req.user as any)?.name || 'Student Demo'
    const { roomId, questionText } = req.body

    if (!roomId || !questionText) {
      return res.status(400).json({ success: false, error: 'roomId and questionText are required.' })
    }

    const doubt = addStudentDoubt({
      roomId,
      studentId,
      studentName,
      questionText,
    })

    res.status(201).json({
      success: true,
      data: doubt,
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// 5. GET /api/classroom/:id/doubts/clustered — AI doubt clustering
export async function handleGetClusteredDoubts(req: Request, res: Response, next: NextFunction) {
  try {
    const roomId = req.params.id
    const clusters = clusterLiveDoubts(roomId)
    res.json({
      success: true,
      data: clusters,
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// 6. POST /api/classroom/pulse-check/launch — Teacher launches 1-question pulse check
export async function handleLaunchPulseCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const { roomId, question, tamilQuestion, options, tamilOptions, correctOptionIndex } = req.body

    const pulse = launchLivePulseCheck({
      roomId,
      question,
      tamilQuestion,
      options: options || ['Option A', 'Option B', 'Option C', 'Option D'],
      tamilOptions,
      correctOptionIndex: correctOptionIndex || 0,
    })

    res.status(201).json({
      success: true,
      data: pulse,
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// 7. POST /api/classroom/pulse-check/respond — Student submits pulse check response
export async function handleRespondPulseCheck(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const studentId = req.user?.userId || 'student-demo'
    const { roomId, selectedOption } = req.body

    const result = recordPulseResponse({
      roomId,
      studentId,
      selectedOption: Number(selectedOption),
    })

    res.json({
      success: true,
      data: result,
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// 8. GET /api/classroom/:id — Get full classroom session data
export async function handleGetClassroom(req: Request, res: Response, next: NextFunction) {
  try {
    const session = getClassroomSessionById(req.params.id)
    if (!session) {
      return res.status(404).json({ success: false, error: 'Classroom session not found.' })
    }
    res.json({
      success: true,
      data: session,
    })
  } catch (err) {
    next(err)
  }
}
