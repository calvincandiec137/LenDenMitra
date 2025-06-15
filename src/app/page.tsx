"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
}

interface QueryResult {
  query: string
  response: string
  source: string
  confidence: number
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your AI assistant. How can I help you today?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvResults, setCsvResults] = useState<QueryResult[]>([])
  const [csvProcessing, setCsvProcessing] = useState(false)
  const [csvError, setCsvError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("http://localhost:8000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: input }),
      })

      if (!response.ok) {
        throw new Error("API request failed")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response || "Sorry, I couldn't process your request.",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error calling API:", error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, there was an error processing your request. Please try again later.",
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0])
      setCsvError(null)
    }
  }

  const handleCsvUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!csvFile) return
    
    setCsvProcessing(true)
    setCsvError(null)
    
    try {
      const formData = new FormData()
      formData.append('file', csvFile)
      
      const response = await fetch('http://localhost:8000/process-csv', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process CSV file')
      }
      
      const data = await response.json()
      setCsvResults(data.results)
    } catch (error) {
      console.error('Error processing CSV:', error)
      setCsvError(error instanceof Error ? error.message : 'Failed to process CSV file')
    } finally {
      setCsvProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-emerald-900 flex flex-col">
      <div className="p-6 border-b border-white/10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-2">LenDen Mitra</h1>
          <p className="text-gray-300"></p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-white/10 border-white/10 backdrop-blur-sm">
              <TabsTrigger value="chat" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white hover:bg-white/15">
                Single Query
              </TabsTrigger>
              <TabsTrigger value="csv" className="text-white data-[state=active]:bg-white/20 data-[state=active]:text-white hover:bg-white/15">
                CSV Upload
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 mb-6 ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === "user" ? "bg-emerald-600" : "bg-purple-600"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>

                    <div
                      className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${
                        message.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      <div
                        className={`inline-block p-4 rounded-2xl ${
                          message.role === "user" ? "bg-emerald-600 text-white" : "bg-white/10 text-white backdrop-blur-sm"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </TabsContent>
            
            <TabsContent value="csv">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">CSV Batch Processing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 relative">
                        <Input
                          type="file"
                          accept=".csv"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                          className="bg-white/10 border-white/20 text-white file:bg-white/20 file:text-white file:border-0 file:rounded-md file:mr-4 file:px-3 file:py-2 placeholder:text-white/60"
                          disabled={csvProcessing}
                        />
                        {!csvFile && (
                          <div className="absolute inset-0 flex items-center pl-3 pointer-events-none">
                            <span className="text-white/60 text-sm">
                              Select CSV file for batch processing
                            </span>
                          </div>
                        )}
                      </div>
                      <Button 
                        type="button" 
                        onClick={handleCsvUpload}
                        disabled={!csvFile || csvProcessing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {csvProcessing ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            Processing...
                          </div>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {csvError && (
                      <Alert variant="destructive" className="bg-red-900/20 border-red-900">
                        <AlertDescription className="text-white">{csvError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  {csvResults.length > 0 && (
                    <div className="mt-6 space-y-4">
                      <h3 className="text-lg font-medium text-white">Results</h3>
                      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                        {csvResults.map((result, index) => (
                          <Card key={index} className="bg-white/10 border-white/10 backdrop-blur-sm">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-white">
                                Q: {result.query}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-sm text-white/90">{result.response}</p>
                              <div className="mt-2 flex justify-between text-xs text-white/60">
                               
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="p-6 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring-emerald-500/20"
              disabled={isLoading}
            />
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}