// এই middleware এ route না মিললে 404 response return হয়।
import { Request, Response } from "express";


const notFound = (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found"
    })
}

export default notFound